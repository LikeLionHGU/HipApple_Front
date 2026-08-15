import { apiFetch } from './client'

export type PricePredictionPeriod = 'ONE_MONTH' | 'SIX_MONTHS' | 'ONE_YEAR'

export type PricePredictionChartPoint = {
  date: string
  predictedPrice: number
  actualPrice: number
}

export type PricePredictionTableRow = {
  date: string
  predictedPrice: number
  actualPrice: number
  changeRate: number
}

export type PricePredictionHistoryResponse = {
  chartPoints: PricePredictionChartPoint[]
  tableRows: PricePredictionTableRow[]
}

// 백엔드 스펙(GET /api/price-predictions)이 받는 쿼리 파라미터는 period 하나뿐이다 (기본값 SIX_MONTHS)
export type PricePredictionHistoryParams = {
  period?: PricePredictionPeriod
}

// AI 가격 예측 이력 (마이페이지 리포트)
export const getPriceHistory = ({ period }: PricePredictionHistoryParams = {}) => {
  const query = period ? `?${new URLSearchParams({ period }).toString()}` : ''
  return apiFetch<PricePredictionHistoryResponse>(`/api/price-predictions${query}`)
}
