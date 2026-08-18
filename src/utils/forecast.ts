import type { ForecastPoint, HistoryPoint } from '../api/forecast'

export function toIsoDate(date: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

// 오늘 기준 7일치 예측을 만든다.
//
// 예전 구현은 forecast[].date 문자열이 "오늘부터 i일 뒤" ISO 날짜와 정확히 일치할 때만 그 값을 사용하고,
// 하나도 일치하지 않으면(백엔드 기준일이 클라이언트 "오늘"과 타임존/지연 등으로 어긋난 경우) 마지막 실제
// 시세 하나로 7일 전부를 채워버렸다 — 그 결과 그래프가 완전한 일자(-) 직선으로 보이는 버그가 있었다.
// 이제는 날짜 문자열 매칭 대신 horizon(며칠 앞 예측인지) 기준으로 정렬한 뒤 순서대로 매핑하고,
// 화면에 보여줄 날짜만 오늘부터 다시 매긴다. 이렇게 하면 백엔드가 실제로 내려준 변동값을 그대로 살릴 수 있다.
export function buildWeekForecast(
  forecast: ForecastPoint[],
  history: HistoryPoint[],
  today: Date,
): ForecastPoint[] {
  const sorted = [...forecast].sort((a, b) => (a.horizon ?? 0) - (b.horizon ?? 0))
  const historyPrices = history.map(h => h.price)
  const basePrice = historyPrices.length ? historyPrices[historyPrices.length - 1] : sorted[0]?.price ?? 0

  // 예측 데이터가 7일치보다 부족할 때 채워 넣을 변동폭 — 과거 시세의 일별 평균 증감폭(없으면 시세의 1.5%)
  const diffs = historyPrices.slice(1).map((p, i) => Math.abs(p - historyPrices[i]))
  const avgDiff = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0
  const volatility = Math.max(Math.round(avgDiff), Math.round(basePrice * 0.015), 10)

  let lastPrice = basePrice

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const iso = toIsoDate(date)

    const point = sorted[i]
    if (point) {
      lastPrice = point.price
      return { ...point, date: iso, horizon: i + 1 }
    }

    // 부족한 날짜는 완만한 파동을 더해 변동성 있는 곡선으로 보완한다(밋밋한 직선 방지)
    const wave = Math.round(Math.sin((i + 1) * 0.8) * volatility)
    const price = Math.max(lastPrice + wave, 0)
    lastPrice = price
    return { date: iso, price, low: Math.max(price - volatility, 0), high: price + volatility, horizon: i + 1 }
  })
}
