import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, startGoogleLogin } from "../api/auth";
import farmsignLogo from "../assets/farmsign-logo.svg";
import Footer from "../components/Footer";
import GoogleIcon from "../components/GoogleIcon";
import "./LandingPage.css";

const FEATURES = [
  {
    title: "저장고 현황 모니터링",
    desc: "온도·습도·에틸렌을 한눈에 확인하고, 권장 기준을 벗어나면 바로 알려드립니다.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3v18M5 8l7-5 7 5M5 8v9l7 4 7-4V8"
          stroke="#1BC485"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "출하 AI 추천",
    desc: "저장 상태와 시세를 함께 분석해, 손실을 줄이는 최적의 출하 시기를 제안합니다.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2l2.4 5.6L20 9l-4.5 4 1.3 6L12 16l-4.8 3 1.3-6L4 9l5.6-1.4L12 2z"
          stroke="#1BC485"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "시장 가격 예측",
    desc: "머신러닝으로 향후 7일 도매 시세를 예측해, 데이터 기반으로 판매 시점을 정하세요.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 19V5M4 19h16M7 15l4-4 3 3 5-6"
          stroke="#1BC485"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function LandingPage() {
  const navigate = useNavigate();

  // 이미 로그인한 사용자는 앱 화면으로
  useEffect(() => {
    if (isLoggedIn()) navigate("/storage", { replace: true });
  }, [navigate]);

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <img className="landing-logo" src={farmsignLogo} alt="팜사인 로고" />
        <div className="landing-nav-actions">
          <button
            className="landing-btn"
            type="button"
            onClick={() => navigate("/login")}
          >
            시작하기
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero">
          <div className="hero-text">
            <span className="hero-badge">AI 사과 출하 의사결정 플랫폼</span>
            <h1 className="hero-title">
              사과, <span className="accent">언제 팔지</span>를<br />
              데이터로 결정하세요
            </h1>
            <p className="hero-desc">
              저장고 상태부터 시장 시세 예측까지 한 곳에서.
              <br />
              팜사인이 최적의 출하 시기를 찾아드립니다.
            </p>
            <div className="hero-cta">
              <button
                className="landing-google-btn lg"
                type="button"
                onClick={() => startGoogleLogin()}
              >
                <GoogleIcon />
                <span>Google로 시작하기</span>
              </button>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="visual-card">
              <div className="visual-card-head">
                <span>서울가락 · 후지</span>
                <span className="visual-badge">7일 예측</span>
              </div>
              <svg viewBox="0 0 260 120" className="visual-chart">
                <defs>
                  <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1BC485" stopOpacity="0.22" />
                    <stop
                      offset="100%"
                      stopColor="#1BC485"
                      stopOpacity="0.02"
                    />
                  </linearGradient>
                </defs>
                <path
                  d="M0,90 L40,80 L80,88 L120,60 L160,66 L200,40 L260,30 L260,120 L0,120 Z"
                  fill="url(#landGrad)"
                />
                <path
                  d="M0,90 L40,80 L80,88 L120,60"
                  fill="none"
                  stroke="#1BC485"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M120,60 L160,66 L200,40 L260,30"
                  fill="none"
                  stroke="#1BC485"
                  strokeWidth="3"
                  strokeDasharray="6 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="120"
                  cy="60"
                  r="4.5"
                  fill="#fff"
                  stroke="#1BC485"
                  strokeWidth="3"
                />
              </svg>
              <div className="visual-rows">
                <div className="visual-row">
                  <span>현재가</span>
                  <strong className="accent">2,310원</strong>
                </div>
                <div className="visual-row">
                  <span>7일 뒤 예측</span>
                  <strong>2,540원</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="features">
          <h2 className="features-title">출하 결정에 필요한 모든 것</h2>
          <p className="features-sub">복잡한 판단을 데이터 하나로 단순하게.</p>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <article className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <h2>지금 팜사인과 함께 시작하세요</h2>
          <p>가입은 무료입니다. Google 계정으로 바로 시작할 수 있어요.</p>
          <button
            className="landing-google-btn lg"
            type="button"
            onClick={() => startGoogleLogin()}
          >
            <GoogleIcon />
            <span>Google로 시작하기</span>
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;
