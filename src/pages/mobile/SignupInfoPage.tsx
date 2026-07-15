import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import farmsignLogo from '../../assets/farmsign-logo.svg'
import './auth.css'

function MobileSignupInfoPage() {
  const navigate = useNavigate()

  const [location, setLocation] = useState('')
  const [variety, setVariety] = useState('')
  const [scale, setScale] = useState('')
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])

  const markets = ['농협 공판장', '도매시장', '직거래']

  const toggleMarket = (market: string) => {
    setSelectedMarkets(prev =>
      prev.includes(market) ? prev.filter(m => m !== market) : [...prev, market],
    )
  }

  return (
    <div className="m-auth">
      <header className="m-auth-nav">
        <img className="m-auth-logo" src={farmsignLogo} alt="팜사인 로고" />
      </header>

      <main className="m-auth-main m-auth-main-form">
        <div className="m-step-indicator">
          <span className="m-step active">1</span>
          <span className="m-step-line active" />
          <span className="m-step active">2</span>
          <span className="m-step-line" />
          <span className="m-step">3</span>
        </div>

        <div className="m-auth-head">
          <h1 className="m-auth-title">회원가입</h1>
          <p className="m-auth-sub">농가 정보를 기입해주세요</p>
        </div>

        <div className="m-auth-form">
          <div className="m-auth-field">
            <label htmlFor="location">농장 이름</label>
            <input id="location" type="text" placeholder="농장 이름을 작성해주세요" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div className="m-auth-field">
            <label htmlFor="variety">재배 품종</label>
            <input id="variety" type="text" placeholder="후지 등" value={variety} onChange={e => setVariety(e.target.value)} />
          </div>
          <div className="m-auth-field">
            <label htmlFor="scale">재배 규모</label>
            <input id="scale" type="text" placeholder="면적 또는 그루 수" value={scale} onChange={e => setScale(e.target.value)} />
          </div>
          <div className="m-auth-field">
            <span className="m-auth-field-label">주요 출하처</span>
            <div className="m-market-chips">
              {markets.map(market => (
                <button
                  key={market}
                  type="button"
                  className={`m-market-chip ${selectedMarkets.includes(market) ? 'selected' : ''}`}
                  onClick={() => toggleMarket(market)}
                >
                  {market}
                </button>
              ))}
            </div>
          </div>

          <button className="m-primary-btn" type="button" onClick={() => navigate('/signup/step3')}>
            다음으로
          </button>
        </div>
      </main>
    </div>
  )
}

export default MobileSignupInfoPage
