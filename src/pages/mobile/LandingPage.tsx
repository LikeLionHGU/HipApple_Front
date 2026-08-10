import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isLoggedIn, startGoogleLogin } from '../../api/auth'
import farmsignLogo from '../../assets/farmsign-logo.svg'
import redAppleIcon from '../../assets/redapple.svg'
import greenAppleIcon from '../../assets/greenapple.svg'
import GoogleIcon from '../../components/GoogleIcon'
import './LandingPage.css'

function NumberedAppleIcon({ index }: { index: number }) {
  return (
    <span className="numbered-apple">
      <img src={index % 2 === 0 ? redAppleIcon : greenAppleIcon} alt="" aria-hidden="true" />
      <span className="numbered-apple-badge">{index + 1}</span>
    </span>
  )
}

const PROBLEMS = [
  { title: '경험 의존 판단', desc: '사과를 직접 꺼내 먹어보며 후숙 상태를 확인하고, 개인의 감각으로 출하 여부를 결정해요' },
  { title: '데이터 축적 부재', desc: '매년 비슷한 점검을 반복하지만, 다음 판단에 쓸 수 있는 데이터는 남지 않아요' },
  { title: '반복되는 손실', desc: '한번 출하한 사과는 되돌릴 수 없어, 기대보다 낮은 가격에도 판매할 수밖에 없어요' },
]

const STATS = [
  { value: '약 1,000만원', label: '농가 한 곳당 연간 손실 가능성' },
  { value: '62.7%', label: '경북이 차지하는 전국 사과 생산 비중' },
  { value: '약 3조원 +', label: '국내 원예농산물 저장, 유통 손실 규모' },
]

const FEATURES = [
  { title: '저장고 현황 모니터링', desc: '온도, 습도, 에틸렌 가스 농도를 한눈에 확인하고, 권장 기준을 벗어나면 알려드려요' },
  { title: '출하 AI 추천', desc: '저장 상태와 시세를 함께 분석해, 손실을 줄이는 최적의 출하 시기를 제안해요' },
  { title: '시장 가격 예측', desc: '향후 7일 도매 시세를 예측해, 데이터 기반으로 판매 시점을 정하세요' },
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
          <div className="m-hero-emojis" aria-hidden="true">
            <img src={redAppleIcon} alt="" />
            <img src={greenAppleIcon} alt="" />
          </div>
          <h1 className="m-hero-title">
            사과, <span className="accent">가장 잘 팔리는 순간</span>을<br />
            AI가 찾아드립니다
          </h1>
          <p className="m-hero-desc">저장고 상태부터 시장 시세 예측까지 한 곳에서</p>
          <span className="m-hero-badge">AI 기반 사과 최적 출하시점 추천 플랫폼</span>
        </section>

        <section className="m-problem-section">
          <h2 className="m-section-title">출하 시기 판단을<br />'경험과 감'에 의존하고 있어요</h2>
          {PROBLEMS.map((p, i) => (
            <article className="m-problem-card" key={p.title}>
              <h3><NumberedAppleIcon index={i} />{p.title}</h3>
              <p>{p.desc}</p>
            </article>
          ))}
        </section>

        <section className="m-stats-section">
          <h2 className="m-section-title">경북 사과 산업, 왜 중요할까요?</h2>
          <div className="m-stats-grid">
            {STATS.map(s => (
              <div className="m-stat-card" key={s.label}>
                <strong className="m-stat-value">{s.value}</strong>
                <p className="m-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="m-features">
          <h2 className="m-section-title">더 나은 <span className="accent">출하 결정</span>을 위해</h2>
          {FEATURES.map((f, i) => (
            <article className="m-feature-card" key={f.title}>
              <div className="m-feature-icon"><NumberedAppleIcon index={i} /></div>
              <div className="m-feature-text">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </article>
          ))}
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
