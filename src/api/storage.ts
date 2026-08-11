import { apiFetch } from './client'

// 저장고 등록/수정 요청 (백엔드 StorageRequest 스키마)
export type StorageRequest = {
  name: string
  appleType: string
  storeDate: string // ISO date-time (예: 2026-07-15T00:00:00)
  storageMethod: string
  brix?: number
  hardness?: number
  condition: string
  amount?: number
  preferredDate: string
}

export type StorageSummary = {
  storageId: number
  name: string
  startDate: number
  type: string
  storageMethod: string
  brix: number
  analysisStartDate?: string
  storagePeriodDays?: number
}

// 출하일별 분석 카드 1건 (날짜 + 예측가 + 등급 + 이벤트)
export type ShipmentAnalysis = {
  date: string // "YYYY-MM-DD"
  predictedPrice: number
  qualityStatus: string
  event: string
}

// 저장 기간 전체에 대한 AI 분석/저장 환경 요약 (마이페이지 리포트 "4. 분석 기간 요약"에 대응)
export type AiAnalysisSummary = {
  analysisCount: number
  shipmentRecommendationCount: number
  maxPredictedPrice: number
  minPredictedPrice: number
  avgPredictedPrice: number
  priceIncreaseDays: number
  priceDecreaseDays: number
}

export type StorageEnvironmentSummary = {
  avgTemperature: number
  avgHumidity: number
  avgCo2: number
  tempDeviationCount: number
  humidityDeviationCount: number
  co2AnomalyCount: number
  environmentStabilityScore: number
}

export type AnalysisPeriodSummary = {
  aiAnalysisSummary: AiAnalysisSummary
  storageEnvironmentSummary: StorageEnvironmentSummary
}

export type StorageDetail = {
  storageId: number
  name: string
  type: string
  startDate: number
  storeDate: string
  storageMethod: string
  brix: number
  hardness: number
  condition: string
  amount: number
  preferredDate: string
  storagePeriodDays: number
  temperature: number
  humidity: number
  ethylene: number
  qualityStatus: string
  shipmentRecommendation: string
  analysisReason: string
  // 판매 수익(가격) 추천 근거 — AI 추천 결과 박스에서 최우선으로 노출
  priceRecommendationReason?: string
  shipmentAnalyses: ShipmentAnalysis[]
  // AI 사진 품질 판정 결과 (사진 업로드 후 채워짐)
  qualityGrade?: string
  qualityRipeness?: string
  qualityColorDescription?: string
  qualityShipmentComment?: string
  qualityConfidence?: string
  qualityCheckedAt?: string
  periodSummary?: AnalysisPeriodSummary
}

// 사진 기반 AI 사과 품질 판정 응답
export type QualityCheckResponse = {
  storageId: number
  checkedAt: string
  grade: string
  ripeness: string
  colorDescription: string
  shipmentComment: string
  confidence: string
  disclaimer: string
}

// 저장고의 주요 일정 (수확일/출하 예정일 등)
export type MajorSchedule = {
  title: string
  date: string
  eventType: string
}

// 전체 저장고 조회
export const getStorages = () => apiFetch<StorageSummary[]>('/storage')

// 저장고 등록
export const createStorage = (data: StorageRequest) =>
  apiFetch<{ result: string }>('/storage', {
    method: 'POST',
    body: JSON.stringify(data),
  })

// 세부 저장고 조회
export const getStorage = (storageId: number) =>
  apiFetch<StorageDetail>(`/storage/${storageId}`)

// 저장고 수정
export const updateStorage = (storageId: number, data: StorageRequest) =>
  apiFetch<{ result: string }>(`/storage/${storageId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

// 저장고 삭제
export const deleteStorage = (storageId: number) =>
  apiFetch<void>(`/storage/${storageId}`, { method: 'DELETE' })

// 사진 기반 AI 사과 품질 판정 (미제출 시 사진 없이 진행 가능)
export const checkQuality = (storageId: number, photo: File) => {
  const formData = new FormData()
  formData.append('photo', photo)
  return apiFetch<QualityCheckResponse>(`/storage/${storageId}/quality-check`, {
    method: 'POST',
    body: formData,
  })
}

// AI 출하 시기 분석 시작
export const startAnalysis = async (storageId: number) => {
  console.log('[API Request] AI 분석 요청 파라미터:', { storageId })
  const result = await apiFetch<StorageDetail>(`/storage/${storageId}/analyze`, { method: 'POST' })
  console.log('[API Response] AI 분석 응답 데이터:', result)
  return result
}

// 로그인 농가의 저장고 이름 목록 (드롭다운용)
export const myStorageNames = () => apiFetch<string[]>('/storage/me')

// 저장고의 주요 일정 목록
export const getMajorSchedules = (storageId: number) =>
  apiFetch<MajorSchedule[]>(`/storage/${storageId}/major-schedules`)
