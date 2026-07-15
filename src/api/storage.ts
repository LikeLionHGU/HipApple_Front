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
  storageName?: string
  name?: string
  startDate: number
  type: string
  storageMethod: string
  brix: number
}

export type StorageDetail = {
  storageId: number
  storageName?: string
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
  nearbyDates: number[]
  lastMeasuredAt?: string
  measuredAt?: string
  updatedAt?: string
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
