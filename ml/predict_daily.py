"""
사과 '일별 대표시세(vwap, 원/kg)' 예측 - 추론 스크립트.

models/final_daily_model.joblib (전체 데이터 학습본; dict 로 model/medians/features 포함)
를 로드해, 주어진 (도매시장 x 품종)의 '가장 최근 관측 행' 피처(최근 lag/roll/유동성)로
다음 대표시세(원/kg)를 예측한다.

사용:
  from predict_daily import predict_next
  krw_per_kg = predict_next("서울가락", "후지")

  CLI:  python3 predict_daily.py                  # 예시 1건 예측
        python3 predict_daily.py 서울가락 후지     # 인자로 (시장, 품종) 지정
"""
import os
import sys

sys.path.insert(0, '/Users/parkseoyeon/Downloads/3학년/멋쟁이사자처럼/HipApple_Front/ml')

import pandas as pd
import joblib

import common_daily as cd

BASE = "/Users/parkseoyeon/Downloads/3학년/멋쟁이사자처럼/HipApple_Front/ml"
MODEL_PATH = os.path.join(BASE, "models", "final_daily_model.joblib")

_bundle = None
_daily = None


def _load():
    """모델 번들과 일별 피처 테이블을 (최초 1회) 로드."""
    global _bundle, _daily
    if _bundle is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"모델 파일이 없습니다: {MODEL_PATH}\n먼저 `python3 train_daily.py` 를 실행하세요."
            )
        _bundle = joblib.load(MODEL_PATH)
    if _daily is None:
        _daily = cd.build_daily()
    return _bundle, _daily


def _match_group(daily, whsl_mrkt_nm, gds_sclsf_nm):
    """부분 일치(포함)로 (시장, 품종) 그룹을 찾는다. 정확 일치 우선."""
    m = daily["whsl_mrkt_nm"].astype(str)
    g = daily["gds_sclsf_nm"].astype(str)

    exact = daily[(m == whsl_mrkt_nm) & (g == gds_sclsf_nm)]
    if len(exact):
        return exact
    return daily[m.str.contains(whsl_mrkt_nm, na=False)
                 & g.str.contains(gds_sclsf_nm, na=False)]


def predict_next(whsl_mrkt_nm, gds_sclsf_nm):
    """(도매시장, 품종)의 최근 행 피처로 다음 대표시세(원/kg)를 예측.

    존재하지 않는 조합이면 안내 문자열을 반환한다.
    """
    bundle, daily = _load()
    model, medians, features = bundle["model"], bundle["medians"], bundle["features"]

    sub = _match_group(daily, whsl_mrkt_nm, gds_sclsf_nm)
    if len(sub) == 0:
        combos = (daily[cd.GROUP_KEYS].drop_duplicates()
                  .head(20).to_string(index=False))
        return (f"[안내] '{whsl_mrkt_nm}' x '{gds_sclsf_nm}' 조합의 과거 데이터가 없습니다.\n"
                f"사용 가능한 (시장, 품종) 예시:\n{combos}")

    latest = sub.sort_values("date").iloc[[-1]].copy()
    mkt = latest["whsl_mrkt_nm"].iloc[0]
    var = latest["gds_sclsf_nm"].iloc[0]
    asof = latest["trd_clcln_ymd"].iloc[0]

    # 결측 수치는 학습 시 train 중앙값으로 대체 (get_xy 와 동일 규칙)
    for c in cd.NUMERIC:
        latest[c] = latest[c].fillna(medians[c])

    X = latest[features]
    pred = float(model.predict(X)[0])

    print(f"  대상    : {mkt} x {var}")
    print(f"  기준시점: {asof} (가장 최근 관측)")
    print(f"  최근시세: lag1={latest['lag1'].iloc[0]:,.0f}  "
          f"roll3={latest['roll3'].iloc[0]:,.0f}  "
          f"roll7={latest['roll7'].iloc[0]:,.0f} (원/kg)")
    return pred


def main():
    args = sys.argv[1:]
    if len(args) >= 2:
        mkt, var = args[0], args[1]
    else:
        mkt, var = "서울가락", "후지"

    print(f"예측 요청: 시장='{mkt}', 품종='{var}'")
    result = predict_next(mkt, var)
    if isinstance(result, str):
        print(result)
    else:
        print(f"\n예측 다음 대표시세: {result:,.1f} 원/kg")


if __name__ == "__main__":
    main()
