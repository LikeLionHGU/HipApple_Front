import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AcceptModal from '../components/AcceptModal'
import suitableIcon from '../assets/적합.svg'
import cautionIcon from '../assets/주의.svg'
import sunIcon from '../assets/Sun.svg'
import snowflakeIcon from '../assets/Snowflake.svg'
import keepDryIcon from '../assets/Keep Dry.svg'
import { getStorage, getStorages, type StorageDetail, type StorageSummary } from '../api/storage'
import './StoragePage.css'

type StorageStatus = 'good' | 'warning'

type StorageMetric = {
  label: string
  value: string
  description: string
  status: StorageStatus
}

// 저장일(storeDate "2026-07-01T00:00:00" 또는 startDate 20260701)에서 Date를 만든다
function parseStoreDate(detail: StorageDetail): Date | null {
  if (detail.storeDate) {
    const parsed = new Date(detail.storeDate)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const digits = String(detail.startDate ?? '').match(/^(\d{4})(\d{2})(\d{2})$/)
  if (digits) return new Date(Number(digits[1]), Number(digits[2]) - 1, Number(digits[3]))
  return null
}

// 저장일로부터 오늘까지 "보관된" 경과 일수를 브라우저 현재 날짜 기준으로 계산한다.
// 저장일이 오늘이거나 미래면 0일. (DST 영향을 피하려고 UTC 자정 기준으로 일수 차이를 구한다)
function calcStorageDays(detail: StorageDetail): number {
  const target = parseStoreDate(detail)
  if (!target) return 0 // 저장일을 알 수 없으면 0 (백엔드 값에 의존하지 않고 순수 프론트 계산)
  const now = new Date()
  const targetUTC = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((todayUTC - targetUTC) / 86_400_000)
  return Math.max(0, diffDays) // 미래 저장일이면 음수 → 0
}

// 세부 저장고 응답(StorageDetail)을 지표 카드 형태로 변환
function buildMetrics(detail: StorageDetail): StorageMetric[] {
  // 저장기간은 저장일로부터 오늘까지의 경과 일수로 계산한다.
  const storageDays = calcStorageDays(detail)
  return [
    { label: '온도', value: `${detail.temperature}°C`, description: '권장 0~4°C', status: detail.temperature >= 0 && detail.temperature <= 4 ? 'good' : 'warning' },
    { label: '습도', value: `${detail.humidity}%`, description: '권장 90~95%', status: detail.humidity >= 90 && detail.humidity <= 95 ? 'good' : 'warning' },
    { label: '에틸렌', value: `${detail.ethylene}ppm`, description: detail.ethylene >= 0.3 ? '주의 수준 도달' : '정상 수준', status: detail.ethylene >= 0.3 ? 'warning' : 'good' },
    { label: '저장기간', value: `${storageDays}일`, description: '최대 35일 권장', status: storageDays <= 35 ? 'good' : 'warning' },
  ]
}

function formatMeasurementDate(detail: StorageDetail) {
  const source = detail.lastMeasuredAt ?? detail.measuredAt ?? detail.updatedAt ?? detail.storeDate
  if (!source) return '측정일 정보 없음'

  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return '측정일 정보 없음'
  return `마지막 측정 ${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

function StoragePage({ showAiRecommendations = false }: { showAiRecommendations?: boolean }) {
  const navigate = useNavigate()
  const [storages, setStorages] = useState<StorageSummary[]>([])
  const [selectedStorageId, setSelectedStorageId] = useState<number | null>(null)
  const [detail, setDetail] = useState<StorageDetail | null>(null)
  const [error, setError] = useState('')
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(showAiRecommendations)
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false)

  useEffect(() => {
    if (showAiRecommendations) {
      setIsAnalysisModalOpen(true)
      setIsAnalysisVisible(false)
    }
  }, [showAiRecommendations])

  // 저장고 목록 조회 후 첫 번째 저장고 선택
  useEffect(() => {
    getStorages()
      .then(list => {
        setStorages(list)
        if (list.length > 0) setSelectedStorageId(list[0].storageId)
      })
      .catch(err => setError(err instanceof Error ? err.message : '저장고 목록을 불러오지 못했습니다.'))
  }, [])

  // 선택된 저장고의 세부 정보 조회
  useEffect(() => {
    if (selectedStorageId == null) return
    getStorage(selectedStorageId)
      .then(setDetail)
      .catch(err => setError(err instanceof Error ? err.message : '저장고 정보를 불러오지 못했습니다.'))
  }, [selectedStorageId])

  const metrics = useMemo(() => (detail ? buildMetrics(detail) : []), [detail])
  const hasWarning = metrics.some(metric => metric.status === 'warning')

  return (
    <div className="storage-page">
      <Header />

      <main className="storage-main">
        <section className="storage-heading" aria-labelledby="storage-title">
          <h1 id="storage-title">저장고 현황</h1>
          <p>저장고의 현재 상태를 한눈에 확인하세요.</p>
        </section>

        {error && <p role="alert" className="storage-error">{error}</p>}

        <section className="storage-overview" aria-label="저장고 상태 요약">
          <div className="storage-selector">
            <label htmlFor="storage-select">저장고</label>
            <select
              id="storage-select"
              value={selectedStorageId ?? ''}
              onChange={event => setSelectedStorageId(Number(event.target.value))}
            >
              {storages.map(storage => (
                <option key={storage.storageId} value={storage.storageId}>
                  {storage.storageName ?? storage.name ?? `저장고 ${storage.storageId}`}
                </option>
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
              <time dateTime={detail?.lastMeasuredAt ?? detail?.measuredAt ?? detail?.updatedAt ?? detail?.storeDate}>
                {detail ? formatMeasurementDate(detail) : '측정일 정보 없음'}
              </time>
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
      <Footer />
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

const ANALYSIS_DATES = [
  '2026-07-15',
  '2026-07-16',
  '2026-07-17',
  '2026-07-18',
  '2026-07-19',
]

type Weather = {
  label: string
  icon: string
}

const DEFAULT_WEATHER: Weather = { label: 'Sun', icon: sunIcon }

function weatherFromCode(code: number): Weather {
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { label: 'Snowflake', icon: snowflakeIcon }
  }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    return { label: 'Keep Dry', icon: keepDryIcon }
  }
  return DEFAULT_WEATHER
}

async function fetchWeatherByDate(): Promise<Record<string, Weather>> {
  if (!navigator.geolocation) return {}

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject)
  })
  const { latitude, longitude } = position.coords
  const startDate = ANALYSIS_DATES[0]
  const endDate = ANALYSIS_DATES[ANALYSIS_DATES.length - 1]
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'weather_code',
    timezone: 'auto',
    start_date: startDate,
    end_date: endDate,
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) throw new Error('날씨 정보를 불러오지 못했습니다.')

  const data = await response.json() as { daily?: { time?: string[]; weather_code?: number[] } }
  const dates = data.daily?.time ?? []
  const codes = data.daily?.weather_code ?? []
  return Object.fromEntries(dates.map((date, index) => [date, weatherFromCode(codes[index] ?? 0)]))
}

function AiRecommendations() {
  const [weatherByDate, setWeatherByDate] = useState<Record<string, Weather>>({})

  useEffect(() => {
    fetchWeatherByDate()
      .then(setWeatherByDate)
      .catch(() => setWeatherByDate({}))
  }, [])

  const days = [
    { apiDate: '2026-07-15', date: '7월 15일', status: '우수', price: '2,341원' },
    { apiDate: '2026-07-16', date: '7월 16일', status: '양호', price: '2,341원' },
    { apiDate: '2026-07-17', date: '7월 17일', status: '우수', price: '2,341원', recommended: true },
    { apiDate: '2026-07-18', date: '7월 18일', status: '불량', price: '2,341원' },
    { apiDate: '2026-07-19', date: '7월 19일', status: '양호', price: '2,341원' },
  ]

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
            <img
              className="weather-icon"
              src={weatherByDate[day.apiDate]?.icon ?? DEFAULT_WEATHER.icon}
              alt={weatherByDate[day.apiDate]?.label ?? DEFAULT_WEATHER.label}
            />
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
