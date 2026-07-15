"""
MAFRA 도매시장 경락가격 상세 API(Grid_20151127000000000313_1)에서
과거(=2023-12-30 이전) '사과' 경락 데이터(등급 STD_QLITY_NEW_NM 포함)를 대량 수집하는 스크립트.

- URL: http://211.237.50.150:7080/openapi/{KEY}/xml/Grid_20151127000000000313_1/{START}/{END}?...
- 필수 파라미터: DELNG_DE(YYYYMMDD), WHSAL_MRKT_NM(구시장명)  ← 코드(WHSAL_MRKT_CODE)로는 필터 불가(ERROR-340 확인)
- STD_PRDLST_NM=사과 서버측 필터 동작 확인됨.
- 'sample' 키는 요청당 최대 5행(초과 시 ERROR-335). 진짜 키는 1000행/페이지.
- 2024-01-01 이후는 totalCnt=0 (데이터 종료). 서버가 매우 느리므로 timeout 90s + 재시도.
- 시장명은 완전일치만 지원(부분일치 '서울'→0, 빈 값→ERROR-341).

[실측 검증(2026-07-15, sample 키, 2023-12-15 서울강서/가락 10행)]
- STD_QLITY_NEW_NM: '특'/'상' 확인 → 등급 정보 존재.
- SBID_PRIC은 포장단위(DELNG_PRUT kg, 예: 10kg 상자) '낙찰가'. kg당 가격 = SBID_PRIC / DELNG_PRUT.
  10행 기준 1,100~13,000원/kg(중앙값 4,400원/kg) — 2023-12 사과 고가 시세와 부합.
  SBID_PRIC 그대로는 11,000~130,000 → kg당으로 보기엔 비상식적.
- 시장별 레거시 피드 종료 시점 상이:
  안동도매시장: 2021-05-14 데이터 있음 / 2021-11-12부터 없음 → 2022~2023 수집 불가.
    안동 과거 데이터가 필요하면 --start 를 2021-06 이전으로 잡을 것.
  광주서부/부산반여/광주각화: 2022-04-15 있음 / 2022-11-11부터 없음 → 2022년 전반기만 수집 가능.
  서울가락/서울강서/대구북부/부산엄궁/인천남촌/대전오정: 2023-12-15 확인.

사용법:
  # 1) 구시장명 탐색 (sample 키로 가능, totalCnt만 확인)
  python3 download_history.py --probe

  # 2) 본 수집 (진짜 키)
  MAFRA_API_KEY=... python3 download_history.py --start 2022-01-01 --end 2023-12-30

  # sample 키로는 dry-run 수준(시장×날짜당 첫 페이지 5행)만 수집된다.
"""
import argparse
import os
import sys
import time
import xml.etree.ElementTree as ET
from datetime import date, timedelta
from urllib.parse import quote

import requests
import pandas as pd

BASE_URL = "http://211.237.50.150:7080/openapi/{key}/xml/Grid_20151127000000000313_1/{start}/{end}"
OUT_CSV = "/Users/parkseoyeon/Downloads/3학년/멋쟁이사자처럼/HipApple_Front/ml/data/apple_history_raw.csv"

TIMEOUT = 150       # 서버가 매우 느림 (실측: 요청당 60~120초+)
RETRIES = 3
SLEEP = 0.3         # 요청 간 대기

# 현행 API(katRealTime2) 시장명 -> 이 API(구) WHSAL_MRKT_NM 후보들.
# 확인된 패턴: '서울가락' -> '서울가락도매시장', '서울강서' -> '서울강서도매시장'
PROBE_CANDIDATES = {
    # probe 실행(2026-07-15)으로 확정: 구시장명 패턴은 '{현행명}도매시장'.
    # 단, 일부 시장은 레거시 피드 종료 시점이 다름(예: 안동/부산반여/광주각화/광주서부는
    # 2020-11-13엔 데이터가 있으나 2022-11-11엔 totalCnt=0 → 2021~2022 사이 신시스템 이관).
    "안동":   ["안동도매시장", "안동농산물도매시장", "안동농수산물도매시장", "안동시농산물도매시장"],
    "서울가락": ["서울가락도매시장", "서울특별시가락동농수산물도매시장", "가락동농수산물도매시장"],
    "서울강서": ["서울강서도매시장", "강서농수산물도매시장"],
    "대구북부": ["대구북부도매시장", "대구북부농수산물도매시장"],
    "광주각화": ["광주각화도매시장", "광주각화농산물도매시장"],
    "광주서부": ["광주서부도매시장", "광주서부농수산물도매시장"],
    "부산엄궁": ["부산엄궁도매시장", "부산엄궁농산물도매시장"],
    "부산반여": ["부산반여도매시장", "부산반여농산물도매시장"],
    "대전오정": ["대전오정도매시장", "대전오정농수산물도매시장"],
    "대전노은": ["대전노은도매시장", "대전노은농수산물도매시장"],
    "인천남촌": ["인천남촌도매시장", "인천남촌농산물도매시장", "인천도매시장"],
    "인천삼산": ["인천삼산도매시장", "인천삼산농산물도매시장"],
    "수원":   ["수원도매시장", "수원농수산물도매시장", "수원시농수산물도매시장"],
    "구리":   ["구리도매시장", "구리농수산물도매시장", "구리시농수산물도매시장"],
    "청주":   ["청주도매시장", "청주농수산물도매시장"],
    "전주":   ["전주도매시장", "전주농수산물도매시장"],
    "포항":   ["포항도매시장", "포항농산물도매시장", "포항시농산물도매시장"],
    "창원팔용": ["창원팔용도매시장", "창원도매시장", "창원팔용농산물도매시장"],
    "울산":   ["울산도매시장", "울산농수산물도매시장"],
}

# 사과 주요 시장(현행 데이터 물량 기준 상위) — probe 실행(2026-07-15)으로 확정한 구시장명.
# 모두 totalCnt>0 확인. (*) 표시 시장은 2020-11-13엔 데이터가 있으나 2022-11-11엔 없음
# → 2021~2022 사이 레거시 피드 종료. 2022~2023 수집 시 해당 시장은 커버리지가 부분적이거나 없음.
DEFAULT_MARKETS = [
    "안동도매시장",        # 현행 '안동' (사과 최대 물량) — 레거시 데이터 2021-05-14 있음, 2021-11-12부터 없음
    "서울가락도매시장",    # 현행 '서울가락' (2023-12 확인)
    "대구북부도매시장",    # 현행 '대구북부' (2023-12 확인)
    "광주서부도매시장",    # 현행 '광주서부' — 2022-04-15 있음, 2022-11-11부터 없음
    "부산반여도매시장",    # 현행 '부산반여' — 2022-04-15 있음, 2022-11-11부터 없음
    "광주각화도매시장",    # 현행 '광주각화' — 2022-04-15 있음, 2022-11-11부터 없음
    "부산엄궁도매시장",    # 현행 '부산엄궁' (2023-12 확인)
    "인천남촌도매시장",    # 현행 '인천남촌' (2023-12 확인)
    "대전오정도매시장",    # 현행 '대전오정' (2023-12 확인)
    "서울강서도매시장",    # 현행 '서울강서' (2023-12 확인)
]

# probe에서 시장명 존재 확인용 날짜(평일). 레거시 피드를 일찍 떠난 시장 탐지를 위해 2020년 날짜 포함.
PROBE_DATES = ["20231215", "20231110", "20230512", "20201113"]

SAMPLE_PAGE = 5      # sample 키 요청당 최대 행
REAL_PAGE = 1000     # 진짜 키 페이지 크기


def build_url(key, start_row, end_row, params):
    """params(dict)를 수동 인코딩해 URL 생성 (한글 파라미터)."""
    qs = "&".join(f"{k}={quote(str(v))}" for k, v in params.items())
    return BASE_URL.format(key=key, start=start_row, end=end_row) + ("?" + qs if qs else "")


def fetch(key, start_row, end_row, params):
    """API 1회 호출. (code, message, total_cnt, rows[list[dict]]) 반환. 실패 시 code='HTTP-ERROR'."""
    url = build_url(key, start_row, end_row, params)
    last_err = None
    for attempt in range(1, RETRIES + 1):
        try:
            r = requests.get(url, timeout=TIMEOUT)
            r.raise_for_status()
            root = ET.fromstring(r.content)
            # 에러 응답은 루트가 <result>, 정상은 <Grid_...> 하위에 <result>
            if root.tag == "result":
                code = root.findtext("code", "")
                msg = root.findtext("message", "")
                return code, msg, 0, []
            res = root.find("result")
            code = res.findtext("code", "") if res is not None else ""
            msg = res.findtext("message", "") if res is not None else ""
            total = int(root.findtext("totalCnt", "0") or 0)
            rows = []
            for row in root.iter("row"):
                rows.append({child.tag: (child.text or "").strip() for child in row})
            return code, msg, total, rows
        except (requests.RequestException, ET.ParseError) as e:
            last_err = e
            wait = 2.0 * attempt
            print(f"    ! 재시도 {attempt}/{RETRIES} ({type(e).__name__}: {e}) — {wait:.0f}s 대기", flush=True)
            time.sleep(wait)
    return "HTTP-ERROR", str(last_err), 0, []


# ---------------------------------------------------------------- probe
def probe_markets(key, targets=None):
    """후보 구시장명들을 던져 totalCnt>0 인 정확한 명칭을 찾는다.
    부하 최소화를 위해 END=1, 품목 필터 없이(시장명 확인이 목적) 요청."""
    targets = targets or list(PROBE_CANDIDATES.keys())
    resolved, failed = {}, []
    for cur_name in targets:
        cands = PROBE_CANDIDATES.get(cur_name, [cur_name, cur_name + "도매시장"])
        found = None
        for cand in cands:
            hit_total = 0
            for d in PROBE_DATES:
                code, msg, total, _ = fetch(key, 1, 1, {"DELNG_DE": d, "WHSAL_MRKT_NM": cand})
                time.sleep(SLEEP)
                if code == "INFO-000" and total > 0:
                    hit_total = total
                    break
                if code not in ("INFO-000",):
                    print(f"  [{cur_name}] '{cand}' {d}: {code} {msg}", flush=True)
                    break  # 인증/파라미터 오류면 날짜 반복 무의미
            if hit_total > 0:
                found = (cand, hit_total)
                break
            print(f"  [{cur_name}] '{cand}': totalCnt=0 (모든 probe 날짜)", flush=True)
        if found:
            resolved[cur_name] = found[0]
            print(f"  [{cur_name}] -> '{found[0]}' 확정 (totalCnt={found[1]})", flush=True)
        else:
            failed.append(cur_name)
            print(f"  [{cur_name}] -> 후보 전부 실패", flush=True)
    print("\n=== probe 결과 ===")
    for k, v in resolved.items():
        print(f"  {k:8s} -> {v}")
    if failed:
        print(f"  (실패: {', '.join(failed)})")
    print("\nDEFAULT_MARKETS 갱신용 리스트:")
    print("  " + repr(list(resolved.values())))
    return resolved


# ---------------------------------------------------------------- collect
def daterange(start, end):
    """일요일(도매시장 휴장)은 스킵 — 요청당 60초+ 걸리는 서버라 확실한 0건 날짜는 건너뜀."""
    d = start
    while d <= end:
        if d.weekday() != 6:
            yield d
        d += timedelta(days=1)


def save_append_dedup(df_new, out_csv=None):
    """기존 CSV에 append 후 dedup 저장.
    ROW_NUM은 응답 내 순번이라 같은 레코드도 조회 구간에 따라 달라질 수 있으므로 dedup 키에서 제외."""
    out_csv = out_csv or OUT_CSV
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)
    # 빈 필드를 NaN이 아닌 ''로 통일해야 dedup이 정확함
    # (기존 CSV의 빈 칸이 NaN으로 읽히면 새 행의 ''와 달라 중복이 잔존하는 버그 방지)
    df_new = df_new.fillna("").astype(str)
    if os.path.exists(out_csv):
        old = pd.read_csv(out_csv, dtype=str, encoding="utf-8-sig",
                          keep_default_na=False)
        df = pd.concat([old, df_new], ignore_index=True)
    else:
        df = df_new
    df = df.fillna("")
    before = len(df)
    key_cols = [c for c in df.columns if c != "ROW_NUM"]
    df = df.drop_duplicates(subset=key_cols)
    df.to_csv(out_csv, index=False, encoding="utf-8-sig")
    return len(df), before - len(df)


def collect(key, start, end, markets, item="사과", out_csv=None):
    is_sample = (key == "sample")
    page_size = SAMPLE_PAGE if is_sample else REAL_PAGE
    if is_sample:
        print("*** 경고: 'sample' 키는 요청당 5행 제한 → dry-run 수준으로 "
              "각 (날짜×시장)의 첫 페이지 5행만 수집합니다. 전체 수집은 발급 키 필요. ***\n", flush=True)

    total_saved = 0
    buffer = []
    n_days = (end - start).days + 1
    print(f"수집: {start} ~ {end} ({n_days}일) × 시장 {len(markets)}개, 품목={item}, 페이지={page_size}행", flush=True)

    for i, d in enumerate(daterange(start, end), 1):
        ymd = d.strftime("%Y%m%d")
        for mkt in markets:
            params = {"DELNG_DE": ymd, "WHSAL_MRKT_NM": mkt, "STD_PRDLST_NM": item}
            code, msg, total, rows = fetch(key, 1, page_size, params)
            time.sleep(SLEEP)
            if code != "INFO-000":
                print(f"  {ymd} {mkt}: {code} {msg} — 건너뜀", flush=True)
                continue
            if total == 0:
                continue
            got = list(rows)
            if not is_sample:
                # 페이지네이션
                s = page_size + 1
                while s <= total:
                    e = min(s + page_size - 1, total)
                    code2, msg2, _, more = fetch(key, s, e, params)
                    time.sleep(SLEEP)
                    if code2 != "INFO-000":
                        print(f"  {ymd} {mkt}: p{s}-{e} {code2} {msg2} — 페이지 중단", flush=True)
                        break
                    got.extend(more)
                    s = e + 1
            # 서버 필터가 안 먹는 경우 대비 클라이언트 필터
            got = [r for r in got if r.get("STD_PRDLST_NM", item) == item or r.get("STD_PRDLST_NEW_NM", "") == item]
            buffer.extend(got)
            print(f"  {ymd} {mkt}: totalCnt={total}, 수집={len(got)}", flush=True)

        # 하루 단위로 주기적 flush (30일마다 또는 버퍼 5만 행 초과)
        if buffer and (i % 30 == 0 or len(buffer) > 50000):
            n, dropped = save_append_dedup(pd.DataFrame(buffer), out_csv=out_csv)
            total_saved = n
            print(f"  -- 중간 저장: 누적 {n:,}행 (중복 제거 {dropped})", flush=True)
            buffer = []

    if buffer:
        n, dropped = save_append_dedup(pd.DataFrame(buffer), out_csv=out_csv)
        total_saved = n
        print(f"  -- 최종 저장: 누적 {n:,}행 (중복 제거 {dropped})", flush=True)
    print(f"\n완료. CSV: {out_csv or OUT_CSV} (총 {total_saved:,}행)", flush=True)


def main():
    ap = argparse.ArgumentParser(description="MAFRA 과거 경락가격(등급 포함) 수집기")
    ap.add_argument("--key", default=os.environ.get("MAFRA_API_KEY", "sample"),
                    help="API 키 (기본: env MAFRA_API_KEY 또는 'sample')")
    ap.add_argument("--start", default="2022-01-01", help="시작일 YYYY-MM-DD")
    ap.add_argument("--end", default="2023-12-30", help="종료일 YYYY-MM-DD (데이터는 2023-12-30까지)")
    ap.add_argument("--markets", nargs="*", default=None,
                    help="구시장명 목록 (기본: 사과 주요시장 확정 명칭). --probe로 탐색 가능")
    ap.add_argument("--item", default="사과", help="STD_PRDLST_NM 품목명")
    ap.add_argument("--probe", action="store_true", help="구시장명 탐색 모드 (totalCnt만 확인)")
    ap.add_argument("--out", default=None, help="출력 CSV 경로(기본 OUT_CSV). 병렬 수집 시 프로세스별 분리용")
    ap.add_argument("--probe-targets", nargs="*", default=None,
                    help="probe 대상(현행 시장명). 기본: 내장 후보 전체")
    args = ap.parse_args()

    if args.probe:
        probe_markets(args.key, args.probe_targets)
        return

    start = date.fromisoformat(args.start)
    end = date.fromisoformat(args.end)
    if end > date(2023, 12, 30):
        print("주의: 2023-12-30 이후는 totalCnt=0 (이 API의 데이터 종료 시점).")
    markets = args.markets if args.markets else DEFAULT_MARKETS
    collect(args.key, start, end, markets, item=args.item, out_csv=args.out)


if __name__ == "__main__":
    main()
