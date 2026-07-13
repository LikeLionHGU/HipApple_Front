import './SignupPage.css'

function SignupPage() {
  const handleGoogleSignup = () => {
    console.log('구글 아이디로 회원가입하러 가는 버튼~')
  }

  const handleNext = () => {
    console.log('구글 로그인 완료하고 다음 페이지로 넘어가는 버튼 ㅇㅇ')
  }

  return (
    <div className="signup-page">
      <header className="navbar">
        <div className="logo">로고</div>
      </header>

      <main className="signup-main">
        <div className="step-indicator">
          <div className="step active">
            <div className="step-circle active">1</div>
          </div>
          <div className="step-line active" />
          <div className="step">
            <div className="step-circle">2</div>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-circle">3</div>
          </div>
        </div>

        <div className="signup-title-block">
          <h1 className="signup-title">회원가입</h1>
          <p className="signup-subtitle">안녕하세요, 반갑습니다</p>
        </div>

        <div className="signup-card">
          <button
            id="google-signup-btn"
            className="google-login-btn"
            onClick={handleGoogleSignup}
            type="button"
          >
            <svg
              className="google-icon"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            <span>Google로 시작하기</span>
          </button>

          <button
            id="next-btn"
            className="next-btn"
            onClick={handleNext}
            type="button"
          >
            다음으로
          </button>
        </div>
      </main>
    </div>
  )
}

export default SignupPage
