import { apiFetch } from './client'

export type PriceOptions = {
  markets: string[]
  varieties: string[]
}

// 차트 실선용 — 최근 실제 시세
export type HistoryPoint = {
  date: string
  price: number
}

// 차트 점선 + 음영밴드용 — 향후 예측
export type ForecastPoint = {
  date: string
  price: number
  low: number
  high: number
  horizon: number // 며칠 앞 예측인지 (1~7)
}

export type ForecastResponse = {
  market: string
  variety: string
  matchedBy?: string // /price/me 응답에만 포함 (어떤 조합을 썼는지)
  unit: string
  asOf: string
  generatedAt: string
  history: HistoryPoint[]
  forecast: ForecastPoint[]
}

// 드롭다운용 시장·품종 목록
export const getPriceOptions = () => apiFetch<PriceOptions>('/price/options')

// 특정 시장·품종의 최근 시세 + 7일 예측
export const getForecast = (market: string, variety: string) => {
  const query = new URLSearchParams({ market, variety }).toString()
  return apiFetch<ForecastResponse>(`/price/forecast?${query}`)
}

// 로그인 농가 프로필 기반 맞춤 예측
export const getMyForecast = () => apiFetch<ForecastResponse>('/price/me')
