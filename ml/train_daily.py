"""
사과 '일별 대표시세(vwap, 원/kg)' 최종 모델 학습·배포 스크립트.

최종 채택 모델: HistGradientBoostingRegressor (일별 대표시세)
  - 범주형 2개(whsl_mrkt_nm, gds_sclsf_nm): OrdinalEncoder(정수화)
    -> HGBR categorical_features 로 네이티브 처리
  - 수치형 11개(lag/roll/vol/momentum/유동성/dow/t_index): passthrough
  - 타깃 vwap: log1p 학습 -> expm1 복원(TransformedTargetRegressor)
  - 작은 데이터(train ~1559행) 과적합 방지를 위한 보수적 규제 + early_stopping

하이퍼파라미터는 '고정'한다(검증에서 지적된 TEST 셋 기반 모델 선택/선택편향을
제거). 값은 검증을 통과한 winner 조합:
  max_depth=5, learning_rate=0.05, max_iter=300, min_samples_leaf=20,
  l2_regularization=2.0, early_stopping=True(validation_fraction=0.15,
  n_iter_no_change=30)

동작:
  1) common_daily.get_xy() 로 시간기반(마지막 거래일 구간=test) 분할 로드
  2) train 으로만 학습 -> TRAIN/TEST 성능 및 roll3 베이스라인 대비 개선 출력
     + permutation importance(상위 피처) 출력
  3) train+test 전체로 재학습한 배포본을 models/final_daily_model.joblib 로 저장
     ({'model':pipe, 'medians':medians, 'features':cd.FEATURES})

베이스라인(TEST) roll3: MAE~917, R2~0.275, MAPE~33% 를 이겨야 함.
"""
import os
import sys

sys.path.insert(0, '/Users/parkseoyeon/Downloads/3학년/멋쟁이사자처럼/HipApple_Front/ml')

import numpy as np
import pandas as pd
import joblib

from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.inspection import permutation_importance

import common_daily as cd

BASE = "/Users/parkseoyeon/Downloads/3학년/멋쟁이사자처럼/HipApple_Front/ml"
MODEL_PATH = os.path.join(BASE, "models", "final_daily_model.joblib")

# 검증 통과 winner (TEST 셋에서 재선택하지 않도록 고정)
PARAMS = dict(
    max_depth=5,
    learning_rate=0.05,
    max_iter=300,
    min_samples_leaf=20,
    l2_regularization=2.0,
)


def build_pipeline():
    """최종 채택(HistGradientBoosting, 일별 vwap) 파이프라인을 새로 생성해 반환."""
    cat = cd.CATEGORICAL
    num = cd.NUMERIC

    pre = ColumnTransformer(
        transformers=[
            ("cat", OrdinalEncoder(handle_unknown="use_encoded_value",
                                   unknown_value=-1,
                                   encoded_missing_value=-1), cat),
            ("num", "passthrough", num),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )
    # 변환 후 컬럼 순서: cat 먼저, 그 뒤 num
    cat_mask = [True] * len(cat) + [False] * len(num)

    hgbr = HistGradientBoostingRegressor(
        loss="squared_error",
        categorical_features=cat_mask,
        early_stopping=True,
        validation_fraction=0.15,
        n_iter_no_change=30,
        random_state=42,
        **PARAMS,
    )

    inner = Pipeline([("pre", pre), ("hgbr", hgbr)])
    model = TransformedTargetRegressor(
        regressor=inner, func=np.log1p, inverse_func=np.expm1,
    )
    return model


def main():
    Xtr, ytr, Xte, yte, medians = cd.get_xy()
    print(f"train: {Xtr.shape} | test: {Xte.shape}")

    # --- roll3 베이스라인(TEST) 재산출 ---
    _, test_df = cd.get_split()
    roll3 = test_df["roll3"].fillna(test_df["lag1"]).values
    base = cd.evaluate(yte, roll3)
    print("[baseline roll3] ", base)

    # 1) 일반화 성능: train 으로만 학습 -> test 검증
    pipe = build_pipeline()
    pipe.fit(Xtr, ytr)

    TRAIN = cd.evaluate(ytr, pipe.predict(Xtr))
    pred_te = pipe.predict(Xte)
    TEST = cd.evaluate(yte, pred_te)

    print("\n=== HistGradientBoosting (train-only fit) ===")
    print("TRAIN:", TRAIN)
    print("TEST :", TEST)

    d_mae = base["MAE"] - TEST["MAE"]
    d_r2 = TEST["R2"] - base["R2"]
    print(f"\n[roll3 대비 개선] MAE {base['MAE']:.1f} -> {TEST['MAE']:.1f} "
          f"({d_mae:+.1f}, {d_mae / base['MAE'] * 100:+.1f}%)")
    print(f"[roll3 대비 개선] R2  {base['R2']:.4f} -> {TEST['R2']:.4f} ({d_r2:+.4f})")
    beats = (TEST["MAE"] < base["MAE"]) and (TEST["R2"] >= base["R2"])
    print(f"beats_roll3: {beats}")

    # feature importance (permutation, TEST 기준)
    r = permutation_importance(
        pipe, Xte, yte, n_repeats=10,
        random_state=42, scoring="neg_mean_absolute_error",
    )
    feats = list(cd.FEATURES)
    order = np.argsort(r.importances_mean)[::-1]
    print("\n=== Feature importance (permutation, TEST) ===")
    for i in order:
        print(f"  {feats[i]:16s}: {r.importances_mean[i]:8.2f} +/- {r.importances_std[i]:.2f}")

    # 3) 배포본: train+test 전체 데이터로 재학습 후 dict 로 저장
    X_full = pd.concat([Xtr, Xte], axis=0, ignore_index=True)
    y_full = np.concatenate([ytr, yte])
    final_pipe = build_pipeline()
    final_pipe.fit(X_full, y_full)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(
        {"model": final_pipe, "medians": medians, "features": cd.FEATURES},
        MODEL_PATH,
    )
    print(f"\nfinal model (fit on full {X_full.shape[0]} rows) saved: {MODEL_PATH}")

    return TRAIN, TEST, base, beats


if __name__ == "__main__":
    main()
