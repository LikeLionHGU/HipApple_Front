import { useNavigate } from 'react-router-dom'
import farmsignLogo from '../assets/farmsign-logo.svg'
import './SignupCompletePage.css'

function SignupCompletePage() {
  const navigate = useNavigate()

  const handleStart = () => {
    navigate('/storage')
  }

  return (
    <div className="signup-complete-page">
      <header className="navbar">
        <img className="logo" src={farmsignLogo} alt="팜사인 로고" />
      </header>

      <main className="signup-complete-main">
        <div className="step-indicator">
          <div className="step-circle active">1</div>
          <div className="step-line active" />
          <div className="step-circle active">2</div>
          <div className="step-line active" />
          <div className="step-circle active">3</div>
        </div>

        <div className="signup-title-block">
          <h1 className="signup-title">농가 등록이 완료되었습니다</h1>
          <p className="signup-subtitle">출하 분석을 시작해보세요</p>
        </div>

        <button
          id="start-service-btn"
          className="start-btn"
          onClick={handleStart}
          type="button"
        >
          서비스 시작하기
        </button>
      </main>
    </div>
  )
}

export default SignupCompletePage
