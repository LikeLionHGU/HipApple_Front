import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
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

function StoragePage() {
  const navigate = useNavigate()
  const [selectedStorage, setSelectedStorage] = useState('A동')
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
              onClick={() => navigate('/StorageInfo')}
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
                    <span className={`status-icon ${metric.status}`} aria-label={metric.status === 'good' ? '적합' : '주의'}>
                      {metric.status === 'good' ? '✓' : '!'}
                    </span>
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
              <span className="badge-icon">{hasWarning ? '!' : '✓'}</span>
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

        <button className="ai-recommend-button" type="button" onClick={() => navigate('/ai')}>
          AI 추천 받기
        </button>
      </main>
    </div>
  )
}

export default StoragePage
