import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/MobileHeader'
import MobileTabBar from '../../components/MobileTabBar'
import suitableIcon from '../../assets/적합.svg'
import cautionIcon from '../../assets/주의.svg'
import redAppleIcon from '../../assets/redapple.svg'
import greenAppleIcon from '../../assets/greenapple.svg'
import alarmIcon from '../../assets/alarm.svg'
import tierExcellentIcon from '../../assets/tier-우수.svg'
import tierGoodIcon from '../../assets/tier-양호.svg'
import tierPoorIcon from '../../assets/tier-불량.svg'
import { startAnalysis, type StorageDetail } from '../../api/storage'
import { getMe } from '../../api/user'
import { getMyForecast, type ForecastResponse } from '../../api/forecast'
import { createSchedule } from '../../api/schedule'
import { getLastAnalyzedStorageId, setLastAnalyzedStorageId } from '../../utils/recentAnalysis'
import './app.css'
import './ShipmentAiPage.css'

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

const TIER_ICONS = { 우수: tierExcellentIcon, 양호: tierGoodIcon, 불량: tierPoorIcon } as const

function highlightAmounts(text: string) {
  const parts = text.split(/(약\s?[\d,]+\s?(?:만\s?)?원)/g)
  return parts.map((part, index) =>
    /^약\s?[\d,]+\s?(?:만\s?)?원$/.test(part) ? <strong key={index}>{part}</strong> : part,
  )
}

function MobileShipmentAiPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const stateStorageId = (location.state as { storageId?: number } | null)?.storageId
  // 하단 탭바 '출하 AI' 등 storageId 없이 진입한 경우, 가장 최근에 분석했던 저장고를 이어서 보여준다
  const storageId = stateStorageId ?? getLastAnalyzedStorageId() ?? undefined

  const [farmerName, setFarmerName] = useState('')
  const [detail, setDetail] = useState<StorageDetail | null>(null)
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
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
    setLastAnalyzedStorageId(storageId)
    startAnalysis(storageId)
      .then(setDetail)
      .catch(err => setError(err instanceof Error ? err.message : 'AI 분석에 실패했습니다.'))
  }, [storageId])

  const today = useMemo(() => new Date(), [])

  const nearbyDates = (detail?.nearbyDates ?? [])
    .map(parseIntDate)
    .filter((d): d is Date => d !== null)
    .filter(d => isWithinRecommendationWindow(d, today))
    .sort((a, b) => a.getTime() - b.getTime())
  const recommendedDate = nearbyDates[0] ?? null

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
    <div className="m-app with-tabbar">
      <MobileHeader />

      {isLoading ? (
        <main className="m-ai-loading">
          <div className="m-ai-loading-emojis" aria-hidden="true">
            <img src={redAppleIcon} alt="" /><img src={greenAppleIcon} alt="" /><img src={redAppleIcon} alt="" />
          </div>
          <p>AI가 최적의 출하 시기를<br />분석하고 있어요<br />잠시만 기다려주세요</p>
        </main>
      ) : (
        <>
          <section className="m-ai-hero">
            <h1>{farmerName ? `${farmerName} 농가님,` : '농가님,'}</h1>
            <p>현재 보관 중인 {detail?.type ?? '사과'} 사과의<br />최적 출하 시기를 분석했습니다.</p>
          </section>

          <main className="m-body">
            {error && <p role="alert" className="m-error">{error}</p>}
            {alarmSaved && <p className="m-ai-alarm-saved">출하 알림이 등록되었습니다.</p>}

            {detail && (
              <>
                <div className="m-ai-storage-box">
                  <span className="m-ai-overview-label">저장고</span>
                  <div className="m-ai-storage-name">{detail.storageName ?? detail.name}</div>
                </div>

                <div className="m-ai-metrics-head">
                  <span className="m-ai-overview-label">현재 저장 현황</span>
                </div>
                <div className="m-ai-metric-grid">
                  {metrics.map(metric => (
                    <article className="m-ai-metric-card" key={metric.label}>
                      <div className="m-ai-metric-top">
                        <h3>{metric.label}</h3>
                        <img src={metric.status === 'good' ? suitableIcon : cautionIcon} alt={metric.status === 'good' ? '적합' : '주의'} />
                      </div>
                      <strong>{metric.value}</strong>
                    </article>
                  ))}
                </div>

                <article className="m-recommend-card">
                  <div className="m-recommend-top-row">
                    <span className="m-recommend-label">출하 추천일</span>
                    {recommendedDate && <span className="m-recommend-days">{daysFromToday(recommendedDate)}일 뒤</span>}
                  </div>
                  <strong className="m-recommend-date">
                    {recommendedDate ? formatMonthDay(recommendedDate) : '분석 중'}
                  </strong>
                </article>

                <article className="m-analysis-card">
                  <span className="m-analysis-badge">AI 추천 근거</span>
                  <p>{highlightAmounts(resolveText(detail.shipmentRecommendation, '분석 결과를 준비 중입니다.'))}</p>
                  <button type="button" className="m-market-link-button" onClick={() => navigate('/market')}>
                    판매 수익 예측 보기 →
                  </button>
                </article>

                {nearbyDates.length > 0 && (
                  <>
                    <h3 className="m-daily-title">출하일 별 분석</h3>
                    <div className="m-daily-list">
                      {nearbyDates.map(date => {
                        const iso = toIsoDate(date)
                        const recommended = recommendedDate ? toIsoDate(recommendedDate) === iso : false
                        const price = priceForDate(date)
                        const tier = priceTier(price, allNearbyPrices)
                        return (
                          <article className={`m-daily-card ${recommended ? 'recommended' : ''}`} key={iso}>
                            {recommended && <span className="m-ai-tag">AI 추천</span>}
                            <strong>{formatMonthDay(date)}</strong>
                            {tier && <img className="m-daily-status-icon" src={TIER_ICONS[tier]} alt={tier} />}
                            {price != null && <b>{price.toLocaleString()}원 <small>/1kg</small></b>}
                          </article>
                        )
                      })}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  className="m-primary-btn m-alarm-btn"
                  onClick={() => setIsAlarmOpen(true)}
                  disabled={!recommendedDate}
                >
                  <img className="m-alarm-btn-icon" src={alarmIcon} alt="" /> 출하 알람 맞추기
                </button>

                <section className="m-data-analysis-card">
                  <h3>데이터 분석 근거</h3>
                  <p>{highlightAmounts(resolveText(detail.analysisReason, '분석 근거를 준비 중입니다.'))}</p>
                </section>
              </>
            )}
          </main>
        </>
      )}

      <MobileTabBar />

      {isAlarmOpen && recommendedDate && (
        <div className="m-alarm-overlay" onClick={event => event.target === event.currentTarget && setIsAlarmOpen(false)}>
          <div className="m-alarm-modal" role="dialog" aria-modal="true">
            <div className="m-alarm-modal-head">
              <h2>출하 알림 맞추기</h2>
              <button type="button" aria-label="닫기" onClick={() => setIsAlarmOpen(false)}>×</button>
            </div>
            <div className="m-alarm-date-box">
              <span>알림 예정일</span>
              <strong>{formatMonthDay(recommendedDate)}</strong>
            </div>
            {priceForDate(recommendedDate) != null && (
              <div className="m-alarm-price-box">
                <span>예상 가격</span>
                <strong>{priceForDate(recommendedDate)?.toLocaleString()}원 /1kg</strong>
              </div>
            )}
            <div className="m-alarm-modal-buttons">
              <button type="button" className="m-alarm-later-button" onClick={() => setIsAlarmOpen(false)}>다음에</button>
              <button type="button" className="m-alarm-confirm-button" onClick={handleCreateAlarm}>알림 받기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileShipmentAiPage
