const TOKEN_KEY = 'accessToken'
const OAUTH_STATE_KEY = 'oauthState'

export const getToken = () => window.localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string) => window.localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY)
export const isLoggedIn = () => Boolean(getToken())

// 로그아웃: 저장된 토큰과 로그인 관련 임시 데이터를 모두 지운다.
export function logout() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.sessionStorage.removeItem(OAUTH_STATE_KEY)
}

export const getRedirectUri = () => `${window.location.origin}/auth/callback`

// 구글 로그인 화면으로 이동. 백엔드가 ID 토큰 방식(/user/google, { idToken })이라
// response_type=id_token 으로 ID 토큰을 직접 받아온다.
// 신규/기존 회원 분기는 로그인 응답의 isNewUser로 처리한다.
export function startGoogleLogin() {
  const state = crypto.randomUUID()
  window.sessionStorage.setItem(OAUTH_STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'id_token',
    scope: 'openid email profile',
    state,
    nonce: crypto.randomUUID(),
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export function verifyOauthState(state: string | null) {
  const saved = window.sessionStorage.getItem(OAUTH_STATE_KEY)
  window.sessionStorage.removeItem(OAUTH_STATE_KEY)
  return Boolean(state) && state === saved
}
