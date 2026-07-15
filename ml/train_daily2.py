"""
사과 '일별 대표시세(vwap, 원/kg)' 학습 스크립트 v2 — 과거 히스토리 + 계절성 확장판.

train_daily.py 와 동일한 HistGradientBoosting 구성(하이퍼파라미터 고정)에,
데이터/피처만 common_hist.build_daily_ext 로 교체:
  - 히스토리(data/apple_history_raw.csv)가 있으면 2023년까지의 과거 시세를
    이어붙여 학습(lag/roll 은 era 구간 내에서만 계산 — 갭 누수 없음).
  - 히스토리가 없으면(현재 상태) 현행 26일 데이터만으로 기존과 동일하게 동작.
  - 계절성 피처 3개(month, doy_sin, doy_cos) 추가 — 짧은 데이터에선 중립~미미해야 정상.

시간분할(TEST_START=2026-07-10)/평가(common.evaluate)는 기존 기준을 그대로 재사용.
배포본은 models/final_daily_model2.joblib 로 저장(기존 모델 파일을 덮지 않음).
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

import common_hist as ch

BASE = "/Users/parkseoyeon/Downloads/3학년/멋쟁이사자처럼/HipApple_Front/ml"
MODEL_PATH = os.path.join(BASE, "models", "final_daily_model2.joblib")

# train_daily.py 와 동일 — TEST 셋 기반 재선택 금지(고정)
PARAMS = dict(
    max_depth=5,
    learning_rate=0.05,
    max_iter=300,
    min_samples_leaf=20,
    l2_regularization=2.0,
)


def build_pipeline():
    """train_daily.build_pipeline 과 동일 구성, 피처 목록만 common_hist 기준."""
    cat = ch.CATEGORICAL
    num = ch.NUMERIC

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
    hist = ch.load_history()
    print(f"history rows: {len(hist)}"
          + ("" if len(hist) else "  (히스토리 없음 -> 현행 데이터만 사용)"))

    # 등급 비율 테이블 (히스토리 있을 때만 생성/저장)
    grade_tab = ch.build_grade_table(hist=hist if len(hist) else None) if len(hist) else None
    if grade_tab is not None:
        print(f"grade ratio table: {grade_tab.shape} -> {ch.GRADE_RATIO_CSV}")

    Xtr, ytr, Xte, yte, medians = ch.get_xy()
    print(f"train: {Xtr.shape} | test: {Xte.shape}")

    # --- roll3 베이스라인(TEST) ---
    _, test_df = ch.get_split()
    roll3 = test_df["roll3"].fillna(test_df["lag1"]).values
    base = ch.evaluate(yte, roll3)
    print("[baseline roll3] ", base)

    # 1) 일반화 성능: train 으로만 학습 -> test 검증
    pipe = build_pipeline()
    pipe.fit(Xtr, ytr)

    TRAIN = ch.evaluate(ytr, pipe.predict(Xtr))
    TEST = ch.evaluate(yte, pipe.predict(Xte))

    print("\n=== HistGradientBoosting v2 (history+seasonality, train-only fit) ===")
    print("TRAIN:", TRAIN)
    print("TEST :", TEST)

    d_mae = base["MAE"] - TEST["MAE"]
    d_r2 = TEST["R2"] - base["R2"]
    print(f"\n[roll3 대비 개선] MAE {base['MAE']:.1f} -> {TEST['MAE']:.1f} "
          f"({d_mae:+.1f}, {d_mae / base['MAE'] * 100:+.1f}%)")
    print(f"[roll3 대비 개선] R2  {base['R2']:.4f} -> {TEST['R2']:.4f} ({d_r2:+.4f})")

    # feature importance (permutation, TEST 기준)
    r = permutation_importance(
        pipe, Xte, yte, n_repeats=10,
        random_state=42, scoring="neg_mean_absolute_error",
    )
    feats = list(ch.FEATURES)
    order = np.argsort(r.importances_mean)[::-1]
    print("\n=== Feature importance (permutation, TEST) ===")
    for i in order:
        print(f"  {feats[i]:16s}: {r.importances_mean[i]:8.2f} +/- {r.importances_std[i]:.2f}")

    # 3) 배포본: train+test 전체로 재학습 후 저장
    X_full = pd.concat([Xtr, Xte], axis=0, ignore_index=True)
    y_full = np.concatenate([ytr, yte])
    final_pipe = build_pipeline()
    final_pipe.fit(X_full, y_full)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(
        {"model": final_pipe, "medians": medians, "features": ch.FEATURES,
         "history_rows": int(len(hist))},
        MODEL_PATH,
    )
    print(f"\nfinal model v2 (fit on full {X_full.shape[0]} rows) saved: {MODEL_PATH}")

    return TRAIN, TEST, base


if __name__ == "__main__":
    main()
