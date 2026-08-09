import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import suitableIcon from '../assets/적합.svg'
import cautionIcon from '../assets/주의.svg'
import sunIcon from '../assets/Sun.svg'
import snowflakeIcon from '../assets/Snowflake.svg'
import keepDryIcon from '../assets/Keep Dry.svg'
import { startAnalysis, type StorageDetail } from '../api/storage'
import { getMe } from '../api/user'
import { getMyForecast, type ForecastResponse } from '../api/forecast'
import { createSchedule } from '../api/schedule'
import './ShipmentAiPage.css'

// 백엔드가 YYYYMMDD 정수로 내려주는 날짜를 Date로 변환
function parseIntDate(value: number): Date | null {
  const digits = String(value).match(/^(\d{4})(\d{2})(\d{2})$/)
  if (!digits) return null
  return new Date(Number(digits[1]), Number(digits[2]) - 1, Number(digits[3]))
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

function daysFromToday(date: Date) {
  const now = new Date()
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const targetUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((targetUTC - todayUTC) / 86_400_000)
}

function toIsoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 오늘(포함)부터 6일 뒤(포함)까지만 출하 추천/예측 대상으로 인정한다 — 과거 날짜는 완전히 제외
function isWithinRecommendationWindow(date: Date, today: Date): boolean {
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const dateUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((dateUTC - todayUTC) / 86_400_000)
  return diffDays >= 0 && diffDays <= 6
}

// 백엔드가 아직 값을 정하지 못했을 때 내려주는 자리표시자는 실제 분석 결과가 아니므로 안내 문구로 대체한다
const PLACEHOLDER_TEXTS = new Set(['미정', 'TBD', 'N/A'])
function resolveText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim()
  if (!trimmed || PLACEHOLDER_TEXTS.has(trimmed)) return fallback
  return trimmed
}

// 저장일(storeDate 또는 startDate)에서 Date를 만든다 — StoragePage와 동일한 계산 방식
function parseStoreDate(detail: StorageDetail): Date | null {
  if (detail.storeDate) {
    const parsed = new Date(detail.storeDate)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const digits = String(detail.startDate ?? '').match(/^(\d{4})(\d{2})(\d{2})$/)
  if (digits) return new Date(Number(digits[1]), Number(digits[2]) - 1, Number(digits[3]))
  return null
}

function calcStorageDays(detail: StorageDetail): number {
  const target = parseStoreDate(detail)
  if (!target) return 0
  const now = new Date()
  const targetUTC = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.floor((todayUTC - targetUTC) / 86_400_000))
}

type MetricStatus = 'good' | 'warning'
type Metric = { label: string; value: string; status: MetricStatus }

function buildMetrics(detail: StorageDetail): Metric[] {
  const storageDays = calcStorageDays(detail)
  return [
    { label: '온도', value: `${detail.temperature}°C`, status: detail.temperature >= 0 && detail.temperature <= 4 ? 'good' : 'warning' },
    { label: '습도', value: `${detail.humidity}%`, status: detail.humidity >= 90 && detail.humidity <= 95 ? 'good' : 'warning' },
    { label: '에틸렌', value: `${detail.ethylene}ppm`, status: detail.ethylene >= 0.3 ? 'warning' : 'good' },
    { label: '저장기간', value: `${storageDays}일`, status: storageDays <= 35 ? 'good' : 'warning' },
  ]
}

function formatMeasurementDate(detail: StorageDetail) {
  const source = detail.lastMeasuredAt ?? detail.measuredAt ?? detail.updatedAt ?? detail.storeDate
  if (!source) return '측정일 정보 없음'
  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return '측정일 정보 없음'
  return `마지막 측정 ${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

// 해당 날짜의 예측가가 조회 기간 내에서 상/중/하위 어디에 속하는지로 등급을 매긴다 (실제 예측가 기반, 임의 값 아님)
function priceTier(price: number | null, allPrices: number[]): '우수' | '양호' | '불량' | null {
  if (price == null || allPrices.length < 2) return null
  const min = Math.min(...allPrices)
  const max = Math.max(...allPrices)
  if (max === min) return '양호'
  const ratio = (price - min) / (max - min)
  if (ratio >= 0.66) return '우수'
  if (ratio >= 0.33) return '양호'
  return '불량'
}

// 문장 속 "약 129만 원", "1,800원" 같은 금액 표현을 굵게 강조
function highlightAmounts(text: string) {
  const parts = text.split(/(약\s?[\d,]+\s?(?:만\s?)?원)/g)
  return parts.map((part, index) =>
    /^약\s?[\d,]+\s?(?:만\s?)?원$/.test(part) ? <strong key={index}>{part}</strong> : part,
  )
}

type Weather = { label: string; icon: string }
const DEFAULT_WEATHER: Weather = { label: 'Sun', icon: sunIcon }

function weatherFromCode(code: number): Weather {
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snowflake', icon: snowflakeIcon }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return { label: 'Keep Dry', icon: keepDryIcon }
  return DEFAULT_WEATHER
}

async function fetchWeatherByDate(isoDates: string[]): Promise<Record<string, Weather>> {
  if (!navigator.geolocation || isoDates.length === 0) return {}
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject)
  })
  const { latitude, longitude } = position.coords
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'weather_code',
    timezone: 'auto',
    start_date: isoDates[0],
    end_date: isoDates[isoDates.length - 1],
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) throw new Error('날씨 정보를 불러오지 못했습니다.')
  const data = await response.json() as { daily?: { time?: string[]; weather_code?: number[] } }
  const dates = data.daily?.time ?? []
  const codes = data.daily?.weather_code ?? []
  return Object.fromEntries(dates.map((date, index) => [date, weatherFromCode(codes[index] ?? 0)]))
}

function ShipmentAiPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const storageId = (location.state as { storageId?: number } | null)?.storageId

  const [farmerName, setFarmerName] = useState('')
  const [detail, setDetail] = useState<StorageDetail | null>(null)
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [weatherByDate, setWeatherByDate] = useState<Record<string, Weather>>({})
  const [error, setError] = useState('')
  const [isAlarmOpen, setIsAlarmOpen] = useState(false)
  const [alarmSaved, setAlarmSaved] = useState(false)

  useEffect(() => {
    getMe().then(user => setFarmerName(user.name)).catch(() => setFarmerName(''))
    getMyForecast().then(setForecast).catch(() => setForecast(null))
  }, [])

  useEffect(() => {
    if (storageId == null) {
      setError('저장고 정보가 없습니다. 저장고 현황에서 다시 시도해주세요.')
      return
    }
    startAnalysis(storageId)
      .then(setDetail)
      .catch(err => setError(err instanceof Error ? err.message : 'AI 분석에 실패했습니다.'))
  }, [storageId])

  // 오늘 날짜 (컴포넌트 생애주기 동안 고정)
  const today = useMemo(() => new Date(), [])

  // 백엔드가 내려준 인근 분석일 중 오늘~6일 뒤 범위만 남기고 날짜 오름차순으로 정리한다 (첫 번째 값을 추천일로 취급)
  const nearbyDates = (detail?.nearbyDates ?? [])
    .map(parseIntDate)
    .filter((d): d is Date => d !== null)
    .filter(d => isWithinRecommendationWindow(d, today))
    .sort((a, b) => a.getTime() - b.getTime())
  const recommendedDate = nearbyDates[0] ?? null

  useEffect(() => {
    if (nearbyDates.length === 0) return
    fetchWeatherByDate(nearbyDates.map(toIsoDate)).then(setWeatherByDate).catch(() => setWeatherByDate({}))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail])

  const priceForDate = (date: Date) => {
    const iso = toIsoDate(date)
    const point = forecast?.forecast.find(p => p.date === iso) ?? forecast?.history.find(p => p.date === iso)
    return point?.price ?? null
  }

  const isLoading = storageId != null && !detail && !error
  const metrics = detail ? buildMetrics(detail) : []
  const allNearbyPrices = nearbyDates.map(priceForDate).filter((p): p is number => p != null)

  const handleCreateAlarm = async () => {
    if (!recommendedDate) return
    try {
      await createSchedule({ title: '출하 알림', scheduleDate: toIsoDate(recommendedDate) })
      setAlarmSaved(true)
      setIsAlarmOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알림 등록에 실패했습니다.')
    }
  }

  return (
    <div className="ai-page">
      <Header />

      {isLoading ? (
        <main className="ai-loading">
          <div className="ai-loading-emojis" aria-hidden="true">
            <span>🍎</span><span>🍏</span><span>🍎</span><span>🍏</span><span>🍎</span>
          </div>
          <p>AI가 최적의 출하 시기를 분석하고 있어요<br />잠시만 기다려주세요</p>
        </main>
      ) : (
        <>
          <section className="ai-hero">
            <h1>{farmerName ? `${farmerName} 농가님,` : '농가님,'}</h1>
            <p>
              현재 보관 중인 {detail?.type ?? '사과'} 사과의 최적 출하 시기를 분석했습니다.
            </p>
          </section>

          <main className="ai-main">
            {error && <p role="alert" className="ai-error">{error}</p>}
            {alarmSaved && <p className="ai-alarm-saved">출하 알림이 등록되었습니다.</p>}

            {detail && (
              <>
                <div className="ai-overview">
                  <div className="ai-storage-box">
                    <span className="ai-overview-label">저장고</span>
                    <div className="ai-storage-name">{detail.storageName ?? detail.name}</div>
                  </div>
                  <div className="ai-metrics">
                    <div className="ai-metrics-heading">
                      <span className="ai-overview-label">현재 저장 현황</span>
                      <time>{formatMeasurementDate(detail)}</time>
                    </div>
                    <div className="ai-metric-grid">
                      {metrics.map(metric => (
                        <article className="ai-metric-card" key={metric.label}>
                          <div className="ai-metric-top">
                            <h3>{metric.label}</h3>
                            <img
                              className="status-icon"
                              src={metric.status === 'good' ? suitableIcon : cautionIcon}
                              alt={metric.status === 'good' ? '적합' : '주의'}
                            />
                          </div>
                          <strong>{metric.value}</strong>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ai-summary-grid">
                  <article className="recommendation-card">
                    <div className="recommendation-top-row">
                      <span className="recommendation-label">출하 추천일</span>
                      {recommendedDate && <span className="recommendation-days">{daysFromToday(recommendedDate)}일 뒤</span>}
                    </div>
                    <strong className="recommendation-date">
                      {recommendedDate ? formatMonthDay(recommendedDate) : '분석 중'}
                    </strong>
                  </article>
                  <article className="analysis-card">
                    <span className="analysis-badge">AI 추천 근거</span>
                    <p>{highlightAmounts(resolveText(detail.shipmentRecommendation, '분석 결과를 준비 중입니다.'))}</p>
                    <button type="button" className="market-link-button" onClick={() => navigate('/market')}>
                      판매 수익 예측 보기 →
                    </button>
                  </article>
                </div>

                {nearbyDates.length > 0 && (
                  <>
                    <h3 className="daily-analysis-title">출하일 별 분석</h3>
                    <div className="daily-analysis-list">
                      {nearbyDates.map(date => {
                        const iso = toIsoDate(date)
                        const recommended = recommendedDate ? toIsoDate(recommendedDate) === iso : false
                        const price = priceForDate(date)
                        const tier = priceTier(price, allNearbyPrices)
                        return (
                          <article className={`daily-card ${recommended ? 'recommended' : ''}`} key={iso}>
                            {recommended && <span className="ai-tag">AI 추천</span>}
                            <img
                              className="weather-icon"
                              src={weatherByDate[iso]?.icon ?? DEFAULT_WEATHER.icon}
                              alt={weatherByDate[iso]?.label ?? DEFAULT_WEATHER.label}
                            />
                            <strong>{formatMonthDay(date)}</strong>
                            {tier && <span className={`daily-status ${tier}`}>{tier}</span>}
                            {price != null && <b>{price.toLocaleString()}원 <small>/1kg</small></b>}
                          </article>
                        )
                      })}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  className="alarm-button"
                  onClick={() => setIsAlarmOpen(true)}
                  disabled={!recommendedDate}
                >
                  🔔 출하 알람 맞추기
                </button>

                <section className="data-analysis-card">
                  <h3>데이터 분석 근거</h3>
                  <p>{highlightAmounts(resolveText(detail.analysisReason, '분석 근거를 준비 중입니다.'))}</p>
                </section>
              </>
            )}
          </main>
        </>
      )}

      <Footer />

      {isAlarmOpen && recommendedDate && (
        <div className="alarm-overlay" onClick={event => event.target === event.currentTarget && setIsAlarmOpen(false)}>
          <div className="alarm-modal" role="dialog" aria-modal="true">
            <div className="alarm-modal-head">
              <h2>출하 알림 맞추기</h2>
              <button type="button" aria-label="닫기" onClick={() => setIsAlarmOpen(false)}>×</button>
            </div>
            <div className="alarm-date-box">
              <span>알림 예정일</span>
              <strong>{formatMonthDay(recommendedDate)}</strong>
            </div>
            {priceForDate(recommendedDate) != null && (
              <div className="alarm-price-box">
                <span>예상 가격</span>
                <strong>{priceForDate(recommendedDate)?.toLocaleString()}원 /1kg</strong>
              </div>
            )}
            <p className="alarm-question">출하 추천일에 알림을 받을까요?</p>
            <div className="alarm-modal-buttons">
              <button type="button" className="alarm-later-button" onClick={() => setIsAlarmOpen(false)}>다음에</button>
              <button type="button" className="alarm-confirm-button" onClick={handleCreateAlarm}>알림 받기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShipmentAiPage
