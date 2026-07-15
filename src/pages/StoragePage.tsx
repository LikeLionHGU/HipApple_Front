import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import AcceptModal from '../components/AcceptModal'
import suitableIcon from '../assets/적합.svg'
import cautionIcon from '../assets/주의.svg'
import './StoragePage.css'

type StorageStatus = 'good' | 'warning'

type StorageMetric = {
  label: string
  value: string
  description: string
  status: StorageStatus
}

const STORAGE_DATA: Record<string, StorageMetric[]> = {
  A동: [
    { label: '온도', value: '2°C', description: '권장 0~4°C', status: 'good' },
    { label: '습도', value: '90%', description: '권장 90~95%', status: 'good' },
    { label: '에틸렌', value: '0.3ppm', description: '주의 수준 도달', status: 'warning' },
    { label: '저장기간', value: '23일', description: '최대 35일 권장', status: 'good' },
  ],
  B동: [
    { label: '온도', value: '3°C', description: '권장 0~4°C', status: 'good' },
    { label: '습도', value: '92%', description: '권장 90~95%', status: 'good' },
    { label: '에틸렌', value: '0.1ppm', description: '정상 수준', status: 'good' },
    { label: '저장기간', value: '18일', description: '최대 35일 권장', status: 'good' },
  ],
}

function StoragePage({ showAiRecommendations = false }: { showAiRecommendations?: boolean }) {
  const navigate = useNavigate()
  const [selectedStorage, setSelectedStorage] = useState('A동')
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(showAiRecommendations)
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false)

  useEffect(() => {
    if (showAiRecommendations) {
      setIsAnalysisModalOpen(true)
      setIsAnalysisVisible(false)
    }
  }, [showAiRecommendations])
  const metrics = useMemo(() => STORAGE_DATA[selectedStorage], [selectedStorage])
  const hasWarning = metrics.some(metric => metric.status === 'warning')

  return (
    <div className="storage-page">
      <Header />

      <main className="storage-main">
        <section className="storage-heading" aria-labelledby="storage-title">
          <h1 id="storage-title">저장고 현황</h1>
          <p>저장고의 현재 상태를 한눈에 확인하세요.</p>
        </section>

        <section className="storage-overview" aria-label="저장고 상태 요약">
          <div className="storage-selector">
            <label htmlFor="storage-select">저장고</label>
            <select
              id="storage-select"
              value={selectedStorage}
              onChange={event => setSelectedStorage(event.target.value)}
            >
              {Object.keys(STORAGE_DATA).map(storage => (
                <option key={storage} value={storage}>{storage}</option>
              ))}
            </select>
            <button
              className="storage-info-link"
              type="button"
              onClick={() => navigate('/storage/info')}
            >
              저장고 정보
            </button>
          </div>

          <div className="metrics-area">
            <div className="metrics-heading">
              <h2>현재 저장 현황</h2>
              <time dateTime="2026-07-10">마지막 측정 2026.7.10</time>
            </div>
            <div className="metric-grid">
              {metrics.map(metric => (
                <article className="metric-card" key={metric.label}>
                  <div className="metric-card-topline">
                    <h3>{metric.label}</h3>
                    <img
                      className="status-icon"
                      src={metric.status === 'good' ? suitableIcon : cautionIcon}
                      alt={metric.status === 'good' ? '적합' : '주의'}
                    />
                  </div>
                  <strong>{metric.value}</strong>
                  <p>{metric.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="quality-panel" aria-labelledby="quality-title">
          <div className="quality-title-row">
            <h2 id="quality-title">저장 품질 상태</h2>
            <span className={`quality-badge ${hasWarning ? 'warning' : 'good'}`}>
              <span className="badge-icon">
                <img src={hasWarning ? cautionIcon : suitableIcon} alt="" />
                <span>{hasWarning ? '!' : '✓'}</span>
              </span>
              {hasWarning ? '주의' : '적합'}
            </span>
          </div>
          {hasWarning ? (
            <p>
              에틸렌 농도가 주의 수준(0.3ppm)에 도달했습니다.<br />
              장기 저장 시 품질 저하 가능성이 있으며, 빠른 출하를 검토하시기 바랍니다.
            </p>
          ) : (
            <p>현재 저장 환경이 권장 기준을 충족하고 있습니다.</p>
          )}
        </section>

        <button className="ai-recommend-button" type="button" onClick={() => navigate('/storage/ai')}>
          AI 추천 받기
        </button>

        {showAiRecommendations && isAnalysisVisible && <AiRecommendations />}
      </main>
      <AcceptModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        onConfirm={() => {
          setIsAnalysisModalOpen(false)
          setIsAnalysisVisible(true)
        }}
        title="분석이 완료되었습니다"
        subtitle="저장고 상태를 바탕으로 출하 시기를 분석했습니다."
      />
    </div>
  )
}

const WEATHER_ICONS = [
  { label: 'SnowFlake', icon: '❄' },
  { label: 'Sun', icon: '☀' },
  { label: 'Keep Dry', icon: '☂' },
]

function AiRecommendations() {
  const days = useMemo(() => {
    const baseDays = [
      { date: '7월 15일', status: '우수', price: '2,341원' },
      { date: '7월 16일', status: '양호', price: '2,341원' },
      { date: '7월 17일', status: '우수', price: '2,341원', recommended: true },
      { date: '7월 18일', status: '불량', price: '2,341원' },
      { date: '7월 19일', status: '양호', price: '2,341원' },
    ]
    return baseDays.map(day => ({
      ...day,
      weather: WEATHER_ICONS[Math.floor(Math.random() * WEATHER_ICONS.length)],
    }))
  }, [])

  return (
    <section className="ai-recommendations" aria-labelledby="ai-title">
      <div className="ai-intro">
        <h2 id="ai-title"><span>억수로 별난</span> 농가</h2>
        <p>현재 보관 중인 부사 사과의 최적 출하 시기를 분석했습니다.</p>
      </div>

      <div className="ai-summary-grid">
        <article className="recommendation-card">
          <span className="recommendation-label">출하 추천일</span>
          <div className="recommendation-date-row">
            <strong>7월 17일 <small>7일 뒤</small></strong>
            <span className="recommendation-remaining">잔여 저장 가능일 <b>7일</b></span>
          </div>
          <span className="recommendation-grade">우수</span>
          <p>가격이 가장 높고, 현재 저장 상태에서도<br />품질이 유지될 것으로 예상됩니다.</p>
        </article>
        <article className="analysis-card">
          <h3>데이터 분석 근거</h3>
          <div><strong>가격 상승폭 우세</strong><p>다가오는 추석 명절 수요 급증으로 인해 시장 가격이 상승할 것으로 예측됩니다.</p></div>
          <div><strong>품질 저하 손실액 최소화</strong><p>현재 출하 시 품질과 가격의 균형이 가장 좋습니다.</p></div>
        </article>
      </div>

      <h3 className="daily-analysis-title">출하일 별 분석</h3>
      <div className="daily-analysis-list">
        {days.map(day => (
          <article className={`daily-card ${day.recommended ? 'recommended' : ''}`} key={day.date}>
            {day.recommended && <span className="ai-tag">AI 추천</span>}
            <span className="weather-icon" title={day.weather.label} aria-label={day.weather.label}>{day.weather.icon}</span>
            <strong>{day.date}</strong>
            <span className={`daily-status ${day.status}`}>{day.status}</span>
            <b>{day.price} <small>/1kg</small></b>
          </article>
        ))}
      </div>
    </section>
  )
}

export default StoragePage
