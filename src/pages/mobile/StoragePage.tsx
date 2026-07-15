import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/MobileHeader'
import MobileTabBar from '../../components/MobileTabBar'
import AcceptModal from '../../components/AcceptModal'
import suitableIcon from '../../assets/적합.svg'
import cautionIcon from '../../assets/주의.svg'
import './app.css'
import './StoragePage.css'

type StorageStatus = 'good' | 'warning'
type StorageMetric = { label: string; value: string; description: string; status: StorageStatus }

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

function MobileStoragePage({ showAiRecommendations = false }: { showAiRecommendations?: boolean }) {
  const navigate = useNavigate()
  const [selectedStorage, setSelectedStorage] = useState('A동')
  const [isModalOpen, setIsModalOpen] = useState(showAiRecommendations)
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false)

  useEffect(() => {
    if (showAiRecommendations) {
      setIsModalOpen(true)
      setIsAnalysisVisible(false)
    }
  }, [showAiRecommendations])

  const metrics = useMemo(() => STORAGE_DATA[selectedStorage], [selectedStorage])
  const hasWarning = metrics.some(m => m.status === 'warning')

  return (
    <div className="m-app with-tabbar">
      <MobileHeader />

      <main className="m-body">
        <h1 className="m-page-title">저장고 현황</h1>
        <p className="m-page-sub">저장고의 현재 상태를 한눈에 확인하세요.</p>

        <div className="m-storage-selector">
          <select
            className="m-select"
            value={selectedStorage}
            onChange={e => setSelectedStorage(e.target.value)}
          >
            {Object.keys(STORAGE_DATA).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="button" className="m-storage-info-link" onClick={() => navigate('/storage/info')}>
            저장고 정보 ›
          </button>
        </div>

        <div className="m-metrics-head">
          <span className="m-section-title">현재 저장 현황</span>
          <time dateTime="2026-07-10">측정 2026.7.10</time>
        </div>
        <div className="m-metric-grid">
          {metrics.map(m => (
            <article className="m-metric-card" key={m.label}>
              <div className="m-metric-top">
                <h3>{m.label}</h3>
                <img src={m.status === 'good' ? suitableIcon : cautionIcon} alt={m.status === 'good' ? '적합' : '주의'} />
              </div>
              <strong>{m.value}</strong>
              <p>{m.description}</p>
            </article>
          ))}
        </div>

        <section className={`m-quality-panel ${hasWarning ? 'warning' : 'good'}`}>
          <div className="m-quality-head">
            <span className="m-section-title">저장 품질 상태</span>
            <span className={`m-quality-badge ${hasWarning ? 'warning' : 'good'}`}>
              <img src={hasWarning ? cautionIcon : suitableIcon} alt="" />
              {hasWarning ? '주의' : '적합'}
            </span>
          </div>
          {hasWarning ? (
            <p>에틸렌 농도가 주의 수준(0.3ppm)에 도달했습니다. 장기 저장 시 품질 저하 가능성이 있어 빠른 출하를 검토하세요.</p>
          ) : (
            <p>현재 저장 환경이 권장 기준을 충족하고 있습니다.</p>
          )}
        </section>

        <button className="m-primary-btn m-ai-btn" type="button" onClick={() => navigate('/storage/ai')}>
          AI 추천 받기
        </button>

        {showAiRecommendations && isAnalysisVisible && <AiRecommendations />}
      </main>

      <MobileTabBar />

      <AcceptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          setIsModalOpen(false)
          setIsAnalysisVisible(true)
        }}
        title="분석이 완료되었습니다"
        subtitle="저장고 상태를 바탕으로 출하 시기를 분석했습니다."
      />
    </div>
  )
}

const DAYS = [
  { date: '7월 15일', status: '우수', price: '2,341원', weather: '☀' },
  { date: '7월 16일', status: '양호', price: '2,341원', weather: '⛅' },
  { date: '7월 17일', status: '우수', price: '2,341원', weather: '☀', recommended: true },
  { date: '7월 18일', status: '불량', price: '2,341원', weather: '☂' },
  { date: '7월 19일', status: '양호', price: '2,341원', weather: '☀' },
]

function AiRecommendations() {
  return (
    <section className="m-ai-recommend">
      <div className="m-ai-intro">
        <h2><span>억수로 별난</span> 농가</h2>
        <p>현재 보관 중인 부사 사과의 최적 출하 시기를 분석했습니다.</p>
      </div>

      <article className="m-recommend-card">
        <span className="m-recommend-label">출하 추천일</span>
        <strong>7월 17일 <small>7일 뒤</small></strong>
        <span className="m-recommend-grade">우수</span>
        <p>가격이 가장 높고, 현재 저장 상태에서도 품질이 유지될 것으로 예상됩니다.</p>
      </article>

      <article className="m-analysis-card">
        <h3>데이터 분석 근거</h3>
        <div><strong>가격 상승폭 우세</strong><p>다가오는 추석 명절 수요 급증으로 시장 가격 상승이 예측됩니다.</p></div>
        <div><strong>품질 저하 손실액 최소화</strong><p>현재 출하 시 품질과 가격의 균형이 가장 좋습니다.</p></div>
      </article>

      <h3 className="m-daily-title">출하일 별 분석</h3>
      <div className="m-daily-list">
        {DAYS.map(day => (
          <article className={`m-daily-card ${day.recommended ? 'recommended' : ''}`} key={day.date}>
            {day.recommended && <span className="m-ai-tag">AI 추천</span>}
            <span className="m-weather">{day.weather}</span>
            <strong>{day.date}</strong>
            <span className={`m-daily-status ${day.status}`}>{day.status}</span>
            <b>{day.price} <small>/1kg</small></b>
          </article>
        ))}
      </div>
    </section>
  )
}

export default MobileStoragePage
