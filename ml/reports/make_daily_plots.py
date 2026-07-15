"""
일별 대표시세 모델 리포트 그림 생성.
  1) reports/daily_pred_vs_actual.png : TEST 셋 실제 vs 예측 산점도(y=x, 지표표기)
  2) reports/daily_timeseries.png     : 대표 (시장 x 품종) 1~2개의 실제 vs 예측 시계열

train_daily.build_pipeline() 을 그대로 사용(동일 구성). train-only 학습 -> test 평가.
"""
import os
import sys

sys.path.insert(0, '/Users/parkseoyeon/Downloads/3학년/멋쟁이사자처럼/HipApple_Front/ml')

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# 한글 라벨(시장/품종명)이 깨지지 않도록 macOS 기본 한글 폰트 사용
for _f in ["AppleGothic", "AppleSDGothicNeo", "Malgun Gothic", "NanumGothic"]:
    try:
        matplotlib.font_manager.findfont(_f, fallback_to_default=False)
        plt.rcParams["font.family"] = _f
        break
    except Exception:
        continue
plt.rcParams["axes.unicode_minus"] = False

import common_daily as cd
from train_daily import build_pipeline

BASE = "/Users/parkseoyeon/Downloads/3학년/멋쟁이사자처럼/HipApple_Front/ml"
REPORTS = os.path.join(BASE, "reports")
SCATTER_PATH = os.path.join(REPORTS, "daily_pred_vs_actual.png")
TS_PATH = os.path.join(REPORTS, "daily_timeseries.png")


def main():
    Xtr, ytr, Xte, yte, medians = cd.get_xy()
    _, test_df = cd.get_split()

    pipe = build_pipeline()
    pipe.fit(Xtr, ytr)
    pred_te = pipe.predict(Xte)
    m = cd.evaluate(yte, pred_te)

    os.makedirs(REPORTS, exist_ok=True)

    # --- 1) 산점도 ---
    lim = float(max(yte.max(), pred_te.max())) * 1.02
    fig, ax = plt.subplots(figsize=(7, 7))
    ax.scatter(yte, pred_te, s=14, alpha=0.4, edgecolors="none", color="#1f77b4")
    ax.plot([0, lim], [0, lim], "r--", lw=1.5, label="y = x (ideal)")
    ax.set_xlim(0, lim)
    ax.set_ylim(0, lim)
    ax.set_xlabel("Actual vwap (KRW/kg)")
    ax.set_ylabel("Predicted vwap (KRW/kg)")
    ax.set_title("HistGradientBoosting - Daily vwap: Actual vs Predicted (test)\n"
                 f"MAE={m['MAE']}  RMSE={m['RMSE']}  R2={m['R2']}  MAPE={m['MAPE_%']}%")
    ax.legend(loc="upper left")
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(SCATTER_PATH, dpi=120)
    plt.close(fig)
    print("saved:", SCATTER_PATH)

    # --- 2) 대표 (시장 x 품종) 시계열 ---
    td = test_df.copy()
    td["pred"] = pred_te
    # 관측일 수가 많은 상위 그룹 선택
    grp_sizes = (td.groupby(cd.GROUP_KEYS).size()
                 .sort_values(ascending=False))
    top_groups = grp_sizes.head(2).index.tolist()

    fig, axes = plt.subplots(len(top_groups), 1, figsize=(9, 4 * len(top_groups)),
                             squeeze=False)
    for ax, (mkt, var) in zip(axes[:, 0], top_groups):
        sub = td[(td["whsl_mrkt_nm"] == mkt) & (td["gds_sclsf_nm"] == var)] \
            .sort_values("date")
        ax.plot(sub["date"], sub["vwap"], "o-", color="#2ca02c", label="Actual")
        ax.plot(sub["date"], sub["pred"], "s--", color="#d62728", label="Predicted")
        ax.set_title(f"{mkt} x {var}  (test, n={len(sub)})")
        ax.set_ylabel("vwap (KRW/kg)")
        ax.legend(loc="best")
        ax.grid(True, alpha=0.3)
        for lbl in ax.get_xticklabels():
            lbl.set_rotation(30)
            lbl.set_ha("right")
    fig.suptitle("Daily representative price: Actual vs Predicted (time series)", y=1.0)
    fig.tight_layout()
    fig.savefig(TS_PATH, dpi=120)
    plt.close(fig)
    print("saved:", TS_PATH)
    print("test metrics:", m)


if __name__ == "__main__":
    main()
