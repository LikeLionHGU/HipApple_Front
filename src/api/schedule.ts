import { apiFetch } from './client'

// 농가 일정 (마이페이지 캘린더)
export type Schedule = {
  scheduleId: number
  title: string
  scheduleDate: string // YYYY-MM-DD
}

export type ScheduleRequest = {
  title: string
  scheduleDate: string // YYYY-MM-DD
}

// 특정 연/월의 일정 목록
export const getMonthlySchedules = (year: number, month: number) => {
  const query = new URLSearchParams({ year: String(year), month: String(month) }).toString()
  return apiFetch<Schedule[]>(`/api/schedules?${query}`)
}

// 일정 등록
export const createSchedule = (data: ScheduleRequest) =>
  apiFetch<void>('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  })

// 일정 삭제
export const deleteSchedule = (scheduleId: number) =>
  apiFetch<void>(`/api/schedules/${scheduleId}`, { method: 'DELETE' })
