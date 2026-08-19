import { apiFetch } from './client'

export type UserMe = {
  id: number
  name: string
  // 회원가입 시 입력한 농가 이름 — 마이페이지/출하 AI 페이지 이름 표시는 구글 계정명(name)보다 이 값을 우선한다
  farmName?: string
}

// 회원가입 2단계(SignupInfoPage)에서 보내는 농가 정보
export type ProfileRequest = {
  farmName: string
  variety: string
  farmSize?: number
  farmSizeUnit: string
  shipmentType: string
  farmLocation?: string
}

// 사용자 정보 조회 — "OO 농가님" 표시용
export const getMe = () => apiFetch<UserMe>('/user/me')

// 농가 정보 입력
export const saveProfile = (profile: ProfileRequest) =>
  apiFetch<{ result: string }>('/user/profile', {
    method: 'POST',
    body: JSON.stringify(profile),
  })
