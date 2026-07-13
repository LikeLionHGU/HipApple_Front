import { useState, useRef } from 'react'
import Header from '../components/Header'
import './MarketPricePage.css'

const SAMPLE_PRICES = [2180, 2210, 2195, 2240, 2260, 2290, 2310]
const DAYS = ['7/4', '7/5', '7/6', '7/7', '7/8', '7/9', '7/10']

function PriceChart() {
  const min = Math.min(...SAMPLE_PRICES) - 100
  const max = Math.max(...SAMPLE_PRICES) + 100
  const w = 700
  const h = 340
  const pad = { top: 20, bottom: 40, left: 50, right: 20 }
  const chartW = w - pad.left - pad.right
  const chartH = h - pad.top - pad.bottom

  const toX = (i: number) => pad.left + (i / (SAMPLE_PRICES.length - 1)) * chartW
  const toY = (v: number) => pad.top + (1 - (v - min) / (max - min)) * chartH

  const points = SAMPLE_PRICES.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const areaPath = `M${toX(0)},${toY(SAMPLE_PRICES[0])} ` +
    SAMPLE_PRICES.slice(1).map((v, i) => `L${toX(i + 1)},${toY(v)}`).join(' ') +
    ` L${toX(SAMPLE_PRICES.length - 1)},${pad.top + chartH} L${pad.left},${pad.top + chartH} Z`

  const yGrids = [2200, 2250, 2300]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="price-chart-svg">
      {yGrids.map(v => (
        <g key={v}>
          <line x1={pad.left} x2={pad.left + chartW} y1={toY(v)} y2={toY(v)}
            stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
          <text x={pad.left - 8} y={toY(v) + 5} textAnchor="end"
            fontSize="12" fill="#9CA3AF">{v.toLocaleString()}</text>
        </g>
      ))}
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1BC485" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1BC485" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <polyline points={points} fill="none" stroke="#1BC485" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />
      {SAMPLE_PRICES.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="4" fill="#fff"
          stroke="#1BC485" strokeWidth="2.5" />
      ))}
      {DAYS.map((d, i) => {
        const isLast = i === DAYS.length - 1
        return (
          <text key={i} x={toX(i)} y={pad.top + chartH + 20}
            textAnchor="middle" 
            fontSize="12" 
            fontWeight={isLast ? "700" : "400"}
            fill={isLast ? "#1BC485" : "#9CA3AF"}>
            {d}
          </text>
        )
      })}
    </svg>
  )
}

function MarketPricePage() {
  const dateRef = useRef<HTMLInputElement>(null)
  const [rawDate, setRawDate] = useState('2026-07-10')
  const [market, setMarket] = useState('전국도매시장')
  const [item, setItem] = useState('사과')
  const [variety, setVariety] = useState('후지')
  const [searched, setSearched] = useState(true)

  const formatKoreanDate = (d: string) => {
    if (!d) return ''
    const [y, m, day] = d.split('-')
    return `${y}년 ${parseInt(m)}월 ${parseInt(day)}일`
  }

  const handleSearch = () => {
    setSearched(true)
  }

  return (
    <div className="market-page">
      <Header />

      <main className="market-main">
        <div className="page-header">
          <h1 className="page-title">시장 가격</h1>
          <p className="page-subtitle">현재 시장 시세를 한눈에 확인하세요.</p>
        </div>

        <div className="search-row">
          <div className="filter-field">
            <span className="filter-label">날짜</span>
            <div className="filter-input-wrap">
              <div
                className="filter-input date-display"
                onClick={() => dateRef.current?.showPicker()}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && dateRef.current?.showPicker()}
              >
                {formatKoreanDate(rawDate)}
              </div>
              <input
                ref={dateRef}
                type="date"
                value={rawDate}
                onChange={e => setRawDate(e.target.value)}
                className="date-input-hidden"
              />
              <svg className="filter-icon" viewBox="0 0 21 23" fill="none">
                <rect x="1" y="3" width="19" height="19" rx="3" stroke="#6B7280" strokeWidth="1.5"/>
                <path d="M7 1v4M14 1v4M1 9h19" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="filter-field">
            <span className="filter-label">시장</span>
            <div className="filter-input-wrap">
              <select
                className="filter-input"
                value={market}
                onChange={e => setMarket(e.target.value)}
              >
                <option>전국도매시장</option>
                <option>가락시장</option>
                <option>구리시장</option>
              </select>
              <svg className="filter-icon chevron" viewBox="0 0 18 30" fill="none">
                <path d="M4 11l5 5 5-5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="filter-field">
            <span className="filter-label">품목</span>
            <div className="filter-input-wrap">
              <select
                className="filter-input"
                value={item}
                onChange={e => setItem(e.target.value)}
              >
                <option>사과</option>
                <option>배</option>
                <option>감</option>
              </select>
              <svg className="filter-icon chevron" viewBox="0 0 18 30" fill="none">
                <path d="M4 11l5 5 5-5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="filter-field">
            <span className="filter-label">품종</span>
            <div className="filter-input-wrap">
              <select
                className="filter-input"
                value={variety}
                onChange={e => setVariety(e.target.value)}
              >
                <option>후지</option>
                <option>홍로</option>
                <option>아오리</option>
              </select>
              <svg className="filter-icon chevron" viewBox="0 0 18 30" fill="none">
                <path d="M4 11l5 5 5-5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <button id="search-btn" className="search-btn" onClick={handleSearch} type="button">
            검색하기
          </button>
        </div>

        {searched && (
          <div className="search-chip">
            {formatKoreanDate(rawDate)} · 가락시장 · {item} · {variety}
          </div>
        )}

        <div className="chart-section">
          <div className="chart-left-column">
            <div className="chart-header">
              <div className="chart-price-info">
                <span className="chart-price-big">2,310원</span>
                <span className="chart-price-unit">/1kg</span>
              </div>
              <div className="chart-change-info">
                <span className="chart-change-pct">+3.5%</span>
                <span className="chart-change-label">전일 대비</span>
              </div>
            </div>
            <div className="chart-area">
              <PriceChart />
            </div>
          </div>
          <div className="chart-right-column">
            <div className="price-cards-header">
              <span className="price-cards-title">가격 요약</span>
            </div>
            <div className="price-cards">
              <div className="price-card">
                <div className="price-card-info">
                  <span className="price-card-label">현재가</span>
                  <span className="price-card-date green">6월 10일 기준</span>
                </div>
                <span className="price-card-value green">2,310원</span>
              </div>
              <div className="price-card">
                <div className="price-card-info">
                  <span className="price-card-label">주간 평균</span>
                  <span className="price-card-date">6/4~6/10</span>
                </div>
                <span className="price-card-value">2,311원</span>
              </div>
              <div className="price-card">
                <div className="price-card-info">
                  <span className="price-card-label">월간 평균</span>
                  <span className="price-card-date">6월 전체 평균</span>
                </div>
                <span className="price-card-value">2,405원</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ai-analysis-card">
          <div className="ai-analysis-header">
            <span className="ai-label-black">AI 시장 분석</span>
            <span className="ai-label-green">최근 7일 가격 동향 요약</span>
          </div>
          <p className="ai-analysis-text">
            지난 7일간 사과 도매가는 꾸준히 상승하여 현재 43,800원을 기록했습니다.
            이는 장마철 출하량 감소와 맞닿아 있으나, 이번 주말부터 경북 지역 출하가
            재개되면서 가격 하락 압력이 예상됩니다. 현재 가격은 단기 고점일 가능성이
            높아 오늘 출하가 최선의 선택입니다.
          </p>
        </div>
      </main>
    </div>
  )
}

export default MarketPricePage
