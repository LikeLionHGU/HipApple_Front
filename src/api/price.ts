import { apiFetch } from './client'

// TODO: 백엔드 응답 스펙 확정되면 필드 채우기 (Swagger에서 확인)
export type PriceDashboard = Record<string, unknown>

// 시장가격 대시보드 조회
export const getPriceDashboard = () => apiFetch<PriceDashboard>('/api/price/dashboard')
