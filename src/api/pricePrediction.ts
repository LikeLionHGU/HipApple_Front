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

export type PricePredictionHistoryParams = {
  cropType: string
  period?: PricePredictionPeriod
}

// AI 가격 예측 이력 (마이페이지 리포트)
export const getPriceHistory = ({ cropType, period }: PricePredictionHistoryParams) => {
  const query = new URLSearchParams({ cropType, ...(period ? { period } : {}) }).toString()
  return apiFetch<PricePredictionHistoryResponse>(`/api/price-predictions?${query}`)
}
