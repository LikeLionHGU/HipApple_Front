import { apiFetch } from './client'

export type UserMe = {
  id: number
  name: string
}

// 회원가입 2단계(SignupInfoPage)에서 보내는 농가 정보
export type ProfileRequest = {
  farmLocation: string
  variety: string
  farmSize?: number
  farmSizeUnit: string
  shipmentType: string
}

// 사용자 정보 조회 — "OO 농가님" 표시용
export const getMe = () => apiFetch<UserMe>('/user/me')

// 농가 정보 입력
export const saveProfile = (profile: ProfileRequest) =>
  apiFetch<{ result: string }>('/user/profile', {
    method: 'POST',
    body: JSON.stringify(profile),
  })
