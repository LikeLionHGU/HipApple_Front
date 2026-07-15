import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { consumeAuthIntent, setToken, verifyOauthState } from '../api/auth'
import { apiFetch } from '../api/client'
import farmsignLogo from '../assets/farmsign-logo.svg'
import Spinner from '../components/Spinner'
import './LoginPage.css'

type LoginResponse = {
  accessToken: string
}

function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const requested = useRef(false)

  useEffect(() => {
    // React StrictMode에서 effect가 두 번 실행돼도 로그인 요청은 한 번만
    if (requested.current) return
    requested.current = true

    // 구글이 id_token을 URL 해시(#id_token=...)로 돌려준다
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const idToken = hashParams.get('id_token')
    const state = hashParams.get('state')

    if (!idToken || !verifyOauthState(state)) {
      setError('구글 로그인에 실패했습니다. 다시 시도해 주세요.')
      return
    }

    apiFetch<LoginResponse>('/user/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    })
      .then(data => {
        setToken(data.accessToken)
        const intent = consumeAuthIntent()
        navigate(intent === 'signup' ? '/signup/info' : '/storage', { replace: true })
      })
      .catch(() => {
        setError('로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      })
  }, [navigate])

  return (
    <div className="login-page">
      <header className="navbar">
        <img className="logo" src={farmsignLogo} alt="팜사인 로고" />
      </header>

      <main className="login-main">
        <div className="login-card">
          {error ? (
            <>
              <h1 className="login-title">{error}</h1>
              <button className="google-login-btn" type="button" onClick={() => navigate('/login', { replace: true })}>
                로그인 페이지로 돌아가기
              </button>
            </>
          ) : (
            <Spinner size={44} label="로그인 중..." />
          )}
        </div>
      </main>
    </div>
  )
}

export default AuthCallbackPage
