import { startGoogleLogin } from '../../api/auth'
import farmsignLogo from '../../assets/farmsign-logo.svg'
import GoogleIcon from '../../components/GoogleIcon'
import './auth.css'

function MobileLoginPage() {
  return (
    <div className="m-auth">
      <header className="m-auth-nav">
        <img className="m-auth-logo" src={farmsignLogo} alt="팜사인 로고" />
      </header>

      <main className="m-auth-main">
        <div className="m-auth-head">
          <h1 className="m-auth-title">시작하기</h1>
          <p className="m-auth-sub">팜사인에 오신 것을 환영합니다</p>
        </div>

        <button className="m-google-btn" type="button" onClick={() => startGoogleLogin()}>
          <GoogleIcon />
          <span>Google로 시작하기</span>
        </button>
      </main>
    </div>
  )
}

export default MobileLoginPage
