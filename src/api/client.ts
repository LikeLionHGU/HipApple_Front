import { clearToken, getToken } from './auth'

const API_URL = import.meta.env.VITE_API_URL

// 토큰을 자동으로 붙여주는 공용 fetch 래퍼
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('로그인이 만료되었습니다.')
  }
  if (!response.ok) {
    throw new Error(`요청 실패 (${response.status})`)
  }
  // DELETE 등 본문 없는 응답도 안전하게 처리
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
