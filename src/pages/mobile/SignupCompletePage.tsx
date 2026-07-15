import { useNavigate } from 'react-router-dom'
import farmsignLogo from '../../assets/farmsign-logo.svg'
import './auth.css'

function MobileSignupCompletePage() {
  const navigate = useNavigate()

  return (
    <div className="m-auth">
      <header className="m-auth-nav">
        <img className="m-auth-logo" src={farmsignLogo} alt="팜사인 로고" />
      </header>

      <main className="m-auth-main">
        <div className="m-step-indicator">
          <span className="m-step active">1</span>
          <span className="m-step-line active" />
          <span className="m-step active">2</span>
          <span className="m-step-line active" />
          <span className="m-step active">3</span>
        </div>

        <div className="m-complete-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#1BC485" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="m-auth-head">
          <h1 className="m-auth-title">농가 등록이 완료되었습니다</h1>
          <p className="m-auth-sub">출하 분석을 시작해보세요</p>
        </div>

        <button className="m-primary-btn" type="button" onClick={() => navigate('/storage')}>
          서비스 시작하기
        </button>
      </main>
    </div>
  )
}

export default MobileSignupCompletePage
