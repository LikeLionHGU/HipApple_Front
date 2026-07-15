import { apiFetch } from './client'

export type SearchInfo = {
  formatted_title: string
  date: string
  market: string
  item: string
  variety: string
}

export type CurrentPriceInfo = {
  price_per_kg: number
  currency: string
  change_rate: number
  change_direction: string // 'up' | 'down' | 'flat' 등
}

export type PriceSummary = {
  today_price: number
  today_basis_date: string
  weekly_average_price: number
  weekly_basis_range: string
  monthly_average_price: number
  monthly_basis_range: string
}

export type ChartData = {
  date: string
  price: number
}

export type AiMarketAnalysis = {
  title: string
  report_text: string
}

export type PriceDashboardResponse = {
  status: string
  search_info: SearchInfo
  current_price_info: CurrentPriceInfo
  price_summary: PriceSummary
  chart_data: ChartData[]
  ai_market_analysis: AiMarketAnalysis
}

export type PriceDashboardParams = {
  date: string // 'YYYY-MM-DD'
  market_code: string
  item_code: string
  variety_code: string
}

// 시장가격 대시보드 조회 (로그인 필요 · 필터는 숫자 코드로 전달)
export const getPriceDashboard = (params: PriceDashboardParams) => {
  const query = new URLSearchParams(params).toString()
  return apiFetch<PriceDashboardResponse>(`/api/price/dashboard?${query}`)
}
