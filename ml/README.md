# 사과 일별 대표시세 예측 (daily vwap)

전국 공영도매시장 실시간 경매정보를 이용해 **(도매시장 × 품종)별 하루 대표 시세(물량가중 평균, 원/kg)** 를 예측하는 회귀 모델입니다.

> 개별 경매건(1건 낙찰가) 예측도 실험했으나, 가격 최대 결정요인인 **등급(특/상/중/하)이 API에 없어** 개별건 예측의 이론적 R² 상한이 ~16%에 그쳤습니다(같은 시장·품종·날짜 내부 분산이 84%). 그래서 등급 노이즈가 평균으로 상쇄되는 **일별 대표시세**를 최종 모델로 채택했습니다.

## 1. 데이터 출처

- **전국 공영도매시장 실시간 경매정보 API** (한국농수산식품유통공사, `katRealTime2/trades2`)
- 사과만 필터: 대분류 `06`(과실류) + 중분류 `01`(사과)
- 기간: **2026-06-15 ~ 07-14 (26거래일)** — 이 API는 최근 ~30일치만 보관하므로 매일 수집·누적이 필요
- 수집 스크립트: `download_data.py` → 원본 `data/apple_auction_raw.csv` (95,535건)

## 2. 타깃 정의

- **타깃**: `vwap = Σ(price_per_kg × weight) / Σ(weight)` (물량가중 평균 kg당 시세, 원/kg)
  - `price_per_kg = scsbd_prc / unit_qty` (포장 단위 낙찰가를 kg로 정규화)
  - `weight = qty × unit_qty` (거래 중량 kg)
  - 그룹 단위 = (`whsl_mrkt_nm`, `gds_sclsf_nm`) × 거래일자

## 3. 전처리

- `common.py`: 원본 정제(kg 단위만, 유효값 필터, `price_per_kg` 계산, 1~99% 이상치 제거, 원산지 시/도 추출)
- `common_daily.py`: 일별 집계 + 시계열 피처 생성 + 시간기반 분할 + 평가지표
- **분할**: 시간 기반. `2026-07-10` 이후를 test → **train 1,559행 / test 435행** (test는 4거래일)

### 피처 (모두 과거 정보만 사용 → 누수 없음)

| 구분 | 컬럼 | 설명 |
|------|------|------|
| 범주형 | `whsl_mrkt_nm`, `gds_sclsf_nm` | 도매시장, 품종 |
| 수치형 | `lag1`, `lag2`, `lag3` | 최근 1~3거래일 시세 |
| 수치형 | `roll3`, `roll7` | 최근 3/7거래일 평균 |
| 수치형 | `vol_std3` | 최근 3일 변동성 |
| 수치형 | `momentum` | `lag1 - lag2` (단기 추세) |
| 수치형 | `prev_n`, `prev_vol` | 직전일 거래 건수/물량 |
| 수치형 | `dow`, `t_index` | 요일, 추세 인덱스 |

> 모든 lag/roll 피처는 `shift(1)` 후 산출하여 예측 시점 이후 정보가 새지 않습니다.

## 4. 후보 모델 비교 (동일 시간기반 분할·평가, 원/kg)

| 모델 | TEST MAE | TEST RMSE | TEST R² | TEST MAPE(%) |
|------|---------:|----------:|--------:|-------------:|
| **HistGradientBoosting (최종 채택)** | **850.4** | 1188.8 | **0.3288** | **29.65** |
| ElasticNet (log1p) | 869.3 | 1192.6 | 0.3245 | 30.66 |
| XGBoost | 891.0 | 1214.7 | 0.2992 | 30.34 |
| 베이스라인 roll3 (최근3일평균) | 917.3 | 1235.2 | 0.2753 | 32.94 |
| 베이스라인 lag1 (어제값) | 1090.0 | 1511.5 | -0.085 | 38.56 |
| 베이스라인 train 전체평균 | 1149.3 | 1453.8 | -0.0038 | 46.23 |

## 5. 최종 모델

- **모델**: `HistGradientBoostingRegressor` (일별 vwap)
  - 범주형 2개: `OrdinalEncoder` → HGBR `categorical_features` 네이티브 처리
  - 수치형 11개: passthrough
  - 타깃 `log1p` 학습 → `expm1` 복원 (`TransformedTargetRegressor`)
  - 하이퍼파라미터(고정): `max_depth=5, learning_rate=0.05, max_iter=300, min_samples_leaf=20, l2_regularization=2.0`, `early_stopping=True`
- **성능(train 학습 → test 평가, 실측)**: MAE **850.4**, RMSE **1188.8**, R² **0.3288**, MAPE **29.65%**
- **roll3 베이스라인 대비**: MAE −7.3%, R² +0.054
- **주요 피처(permutation importance)**: `roll7` ≫ `whsl_mrkt_nm` ≈ `gds_sclsf_nm` > `lag1` > `prev_vol`
- **저장 형태**: `models/final_daily_model.joblib` = train+test 전체(1,994행)로 재학습한 배포본. `{'model': pipe, 'medians': medians, 'features': FEATURES}` dict
  - 로드에 필요한 패키지: `scikit-learn==1.9.0`, `numpy`, `pandas`, `joblib` (xgboost 불필요)

### 한계

- test 구간이 4거래일(435행)로 작아 개선폭의 통계적 신뢰도는 제한적
- TRAIN R² 0.511 vs TEST R² 0.329 과적합 격차 존재(규제·early stopping으로 통제)
- 근본 원인: **학습 히스토리 21일뿐**(API 30일 보관) + 등급/기상 등 외부 신호 부재
  → 개선 우선순위: ① 매일 데이터 누적, ② 등급·기상·물량추세 등 피처 보강

## 6. 파일 구조

```
ml/
├── common.py                  # 원본 정제·전처리·평가
├── common_daily.py            # 일별 집계·시계열 피처·시간기반 분할
├── download_data.py           # 경매 API 데이터 수집(매일 누적용)
├── train_daily.py             # 최종 모델 학습·평가·저장
├── predict_daily.py           # 최종 모델 로드 후 (시장×품종) 다음 시세 예측
├── README.md
├── data/
│   └── apple_auction_raw.csv  # 원본 경매 데이터
├── models/
│   └── final_daily_model.joblib   # 최종 배포 모델
└── reports/
    ├── make_daily_plots.py        # 아래 그래프 생성 스크립트
    ├── daily_pred_vs_actual.png   # test 실제 vs 예측 산점도
    └── daily_timeseries.png       # 대표 (시장×품종) 시계열 실제 vs 예측
```

## 7. 실행법

```bash
# (선택) 최신 경매 데이터 수집 → data/apple_auction_raw.csv 갱신
python3 download_data.py

# 학습 + test 성능 리포트 + final_daily_model.joblib 저장
python3 train_daily.py

# (시장, 품종)의 다음 대표시세 예측
python3 predict_daily.py 서울가락 후지

# 시각화 그래프 재생성
python3 reports/make_daily_plots.py
```

프로그램에서 직접 예측:

```python
from predict_daily import predict_next

krw_per_kg = predict_next("안동", "썸머킹")   # 최근 lag/roll 기반 다음 대표시세(원/kg)
print(krw_per_kg)
```

## 8. 모델 디벨롭 v2 — 과거 히스토리 + 등급 (구축 완료)

성능 한계의 근본 원인(히스토리 21일 + 등급 부재)을 해결한 확장판입니다.
MAFRA 레거시 경락가격 API(~2023-12, **등급 포함**, 현행과 동일 시장코드)에서
과거 데이터를 수집해 계절성과 등급 구조를 학습했습니다.

### 8.0 v2 결과 (2026-07-15 실측)

- **수집**: 145,828행 (가락/대구북부/강서 2023년 + 안동 2021년, 월별 대표주간 샘플링,
  12-워커 병렬로 24.3분 소요). 정제 후 142,935행, kg당 중앙값 2,889원(시세 부합 검증).
- **학습 데이터**: 1,559 → **2,758 그룹-일 (+77%)** + 완전한 12개월 계절성
- **성능(동일 test: 2026-07-10~14)**:

| 모델 | TEST MAE | RMSE | R² | MAPE |
|------|---------:|-----:|---:|-----:|
| v1 (26일 데이터) | 850.4 | 1188.8 | 0.3288 | 29.65% |
| **v2 (히스토리+계절성)** | **843.1** | **1158.4** | **0.3627** | 29.99% |
| 베이스라인 roll3 | 917.3 | 1235.2 | 0.2753 | 32.94% |

- **등급 비율 테이블**: 383셀 (품종×월×등급, 셀당 30건+), 등급 단조성 97% 정상.
  실제 등급 체계는 특/상/보통/4~8등/무등급. 예: **후지 7월 특=평균의 1.85배, 상=0.76배**
  → `predict_daily2.py` 가 vwap 예측 × 비율로 **등급별 예상가**를 함께 출력.
- 계절성 피처는 7월 단일 시즌 test 에선 중립(중요도≈0) — 연중 서빙에서 의미를 가짐.

| 파일 | 역할 |
|------|------|
| `download_history.py` | MAFRA 과거 데이터 수집기. `--probe`(구시장명 탐색), 페이지네이션·재시도·dedup |
| `common_hist.py` | 과거+현행 결합(era 구간별 lag — 2024~25 갭 누수 차단), 계절성(month/doy), (품종×월×등급) 가격비율 테이블 |
| `train_daily2.py` | v2 학습. 히스토리 없으면 v1과 동등 동작 → `models/final_daily_model2.joblib` |
| `predict_daily2.py` | v2 예측 + 등급별 예상가 출력(비율 테이블 있을 때) |

```bash
# MAFRA 인증키 발급(data.mafra.go.kr) 후:
MAFRA_API_KEY=<발급키> python3 download_history.py --start 2021-01-01 --end 2023-12-30
python3 train_daily2.py      # 히스토리 포함 재학습 + 등급 비율 테이블 생성
python3 predict_daily2.py 서울가락 후지
```

> 주의: 시장별 레거시 피드 종료 시점이 다릅니다 — 안동은 2021-05까지,
> 광주서부·부산반여·광주각화는 2022-04까지, 나머지 주요 시장은 2023-12까지.
> 안동 데이터가 필요하면 `--start`를 2021-06 이전으로 설정하세요.
