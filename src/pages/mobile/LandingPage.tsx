import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isLoggedIn, startGoogleLogin } from '../../api/auth'
import farmsignLogo from '../../assets/farmsign-logo.svg'
import GoogleIcon from '../../components/GoogleIcon'
import './LandingPage.css'

const FEATURES = [
  {
    title: '저장고 현황 모니터링',
    desc: '온도·습도·에틸렌을 한눈에 확인하고 이상 시 바로 알려드립니다.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v18M5 8l7-5 7 5M5 8v9l7 4 7-4V8" stroke="#1BC485" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '출하 AI 추천',
    desc: '저장 상태와 시세를 함께 분석해 최적 출하 시기를 제안합니다.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2l2.4 5.6L20 9l-4.5 4 1.3 6L12 16l-4.8 3 1.3-6L4 9l5.6-1.4L12 2z" stroke="#1BC485" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '시장 가격 예측',
    desc: '머신러닝으로 향후 7일 도매 시세를 예측해 드립니다.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 19V5M4 19h16M7 15l4-4 3 3 5-6" stroke="#1BC485" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
  },
]

function MobileLandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoggedIn()) navigate('/storage', { replace: true })
  }, [navigate])

  return (
    <div className="m-landing">
      <header className="m-landing-nav">
        <img className="m-landing-logo" src={farmsignLogo} alt="팜사인 로고" />
      </header>

      <main className="m-landing-main">
        <section className="m-hero">
          <span className="m-hero-badge">AI 사과 출하 의사결정 플랫폼</span>
          <h1 className="m-hero-title">
            사과, <span className="accent">언제 팔지</span>를<br />
            데이터로 결정하세요
          </h1>
          <p className="m-hero-desc">
            저장고 상태부터 시장 시세 예측까지,<br />
            팜사인이 최적의 출하 시기를 찾아드립니다.
          </p>

          <div className="m-visual-card" aria-hidden="true">
            <div className="m-visual-head">
              <span>서울가락 · 후지</span>
              <span className="m-visual-badge">7일 예측</span>
            </div>
            <svg viewBox="0 0 260 110" className="m-visual-chart">
              <defs>
                <linearGradient id="mLandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1BC485" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#1BC485" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d="M0,85 L40,76 L80,82 L120,56 L160,62 L200,38 L260,28 L260,110 L0,110 Z" fill="url(#mLandGrad)" />
              <path d="M0,85 L40,76 L80,82 L120,56" fill="none" stroke="#1BC485" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M120,56 L160,62 L200,38 L260,28" fill="none" stroke="#1BC485" strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="120" cy="56" r="4.5" fill="#fff" stroke="#1BC485" strokeWidth="3" />
            </svg>
            <div className="m-visual-rows">
              <div className="m-visual-row"><span>현재가</span><strong className="accent">2,310원</strong></div>
              <div className="m-visual-row"><span>7일 뒤 예측</span><strong>2,540원</strong></div>
            </div>
          </div>
        </section>

        <section className="m-features">
          {FEATURES.map(f => (
            <article className="m-feature-card" key={f.title}>
              <div className="m-feature-icon">{f.icon}</div>
              <div className="m-feature-text">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="m-landing-cta">
          <h2>지금 시작하세요</h2>
          <p>Google 계정으로 바로 시작할 수 있어요.</p>
        </section>
      </main>

      {/* 하단 고정 시작 버튼 */}
      <div className="m-cta-bar">
        <button className="m-landing-google-btn" type="button" onClick={() => startGoogleLogin()}>
          <GoogleIcon />
          <span>Google로 시작하기</span>
        </button>
      </div>
    </div>
  )
}

export default MobileLandingPage
