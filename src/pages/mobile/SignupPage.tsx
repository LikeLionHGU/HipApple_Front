import { useNavigate } from 'react-router-dom'
import { isLoggedIn, startGoogleLogin } from '../../api/auth'
import farmsignLogo from '../../assets/farmsign-logo.svg'
import GoogleIcon from '../../components/GoogleIcon'
import './auth.css'

function MobileSignupPage() {
  const navigate = useNavigate()

  const handleNext = () => {
    if (!isLoggedIn()) {
      alert('먼저 Google로 로그인해 주세요.')
      return
    }
    navigate('/signup/info')
  }

  return (
    <div className="m-auth">
      <header className="m-auth-nav">
        <img className="m-auth-logo" src={farmsignLogo} alt="팜사인 로고" />
      </header>

      <main className="m-auth-main">
        <div className="m-step-indicator">
          <span className="m-step active">1</span>
          <span className="m-step-line active" />
          <span className="m-step">2</span>
          <span className="m-step-line" />
          <span className="m-step">3</span>
        </div>

        <div className="m-auth-head">
          <h1 className="m-auth-title">회원가입</h1>
          <p className="m-auth-sub">안녕하세요, 반갑습니다</p>
        </div>

        <button className="m-google-btn" type="button" onClick={() => startGoogleLogin('signup')}>
          <GoogleIcon />
          <span>Google로 시작하기</span>
        </button>

        <button className="m-primary-btn" type="button" onClick={handleNext}>
          다음으로
        </button>
      </main>
    </div>
  )
}

export default MobileSignupPage
