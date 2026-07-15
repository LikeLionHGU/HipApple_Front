import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import farmsignLogo from '../assets/farmsign-logo.svg'
import './SignupInfoPage.css'

function SignupInfoPage() {
  const navigate = useNavigate()

  const [location, setLocation] = useState('')
  const [variety, setVariety] = useState('')
  const [scale, setScale] = useState('')
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])

  const markets = ['농협 공판장', '도매시장', '직거래']

  const toggleMarket = (market: string) => {
    setSelectedMarkets(prev =>
      prev.includes(market)
        ? prev.filter(m => m !== market)
        : [...prev, market]
    )
  }

  const handleNext = () => {
    navigate('/signup/step3')
  }

  return (
    <div className="signup-info-page">
      <header className="navbar">
        <img className="logo" src={farmsignLogo} alt="팜사인 로고" />
      </header>

      <main className="signup-info-main">
        <div className="step-indicator">
          <div className="step-circle active">1</div>
          <div className="step-line active" />
          <div className="step-circle active">2</div>
          <div className="step-line active" />
          <div className="step-circle">3</div>
        </div>

        <div className="signup-title-block">
          <h1 className="signup-title">회원가입</h1>
          <p className="signup-subtitle">농가 정보를 기입해주세요</p>
        </div>

        <div className="signup-info-card">
          <div className="form-field">
            <label className="field-label" htmlFor="location">
              농장 소재지 (시/군/구)
            </label>
            <input
              id="location"
              type="text"
              className="field-input"
              placeholder="지역을 작성해주세요"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="variety">
              재배 품종
            </label>
            <input
              id="variety"
              type="text"
              className="field-input"
              placeholder="후지 등"
              value={variety}
              onChange={e => setVariety(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="scale">
              재배 규모
            </label>
            <input
              id="scale"
              type="text"
              className="field-input"
              placeholder="면적 또는 그루 수"
              value={scale}
              onChange={e => setScale(e.target.value)}
            />
          </div>

          <div className="form-field">
            <span className="field-label">주요 출하처</span>
            <div className="market-options">
              {markets.map(market => (
                <button
                  key={market}
                  type="button"
                  className={`market-btn ${selectedMarkets.includes(market) ? 'selected' : ''}`}
                  onClick={() => toggleMarket(market)}
                >
                  {market}
                </button>
              ))}
            </div>
          </div>

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

export default SignupInfoPage
