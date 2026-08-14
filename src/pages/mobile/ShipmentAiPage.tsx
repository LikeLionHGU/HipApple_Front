import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/MobileHeader'
import MobileTabBar from '../../components/MobileTabBar'
import MobileHeroBanner from '../../components/MobileHeroBanner'
import suitableIcon from '../../assets/적합.svg'
import cautionIcon from '../../assets/주의.svg'
import redAppleIcon from '../../assets/redapple.svg'
import greenAppleIcon from '../../assets/greenapple.svg'
import alarmIcon from '../../assets/alarm.svg'
import tierExcellentIcon from '../../assets/tier-우수.svg'
import tierGoodIcon from '../../assets/tier-양호.svg'
import tierPoorIcon from '../../assets/tier-불량.svg'
import { startAnalysis, type StorageDetail, type ShipmentAnalysis } from '../../api/storage'
import { getMe } from '../../api/user'
import { getMyForecast, type ForecastResponse } from '../../api/forecast'
import { createSchedule } from '../../api/schedule'
import { getLastAnalyzedStorageId, setLastAnalyzedStorageId } from '../../utils/recentAnalysis'
import './app.css'
import './ShipmentAiPage.css'

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']
function formatMonthDayWeekday(date: Date) {
  return `${formatMonthDay(date)} (${WEEKDAY_KO[date.getDay()]})`
}

// AI 추천 근거 문장 속 "약 129만 원" 같은 기대 매출 증가액을 알람 모달에 다시 보여주기 위해 추출
function extractRevenueIncrease(text: string): string | null {
  const match = text.match(/약\s?([\d,]+)\s?만\s?원/)
  return match ? `+${match[1]}만원` : null
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

// 내일(D+1)부터 7일 뒤(D+7)까지 총 7일치를 출하일 별 분석 카드로 보여준다
const DAILY_CARD_COUNT = 7

// 백엔드가 아직 값을 정하지 못했을 때 내려주는 자리표시자는 실제 분석 결과가 아니므로 안내 문구로 대체한다
const PLACEHOLDER_TEXTS = new Set(['미정', 'TBD', 'N/A'])
function resolveText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim()
  if (!trimmed || PLACEHOLDER_TEXTS.has(trimmed)) return fallback
  return trimmed
}

// shipmentRecommendation은 "YYYY-MM-DD" 형식의 출하 추천일 문자열이다 (추천 근거 텍스트가 아님)
function parseIsoDate(value: string | undefined): Date | null {
  const match = value?.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

// 백엔드가 응답을 200으로 내려줘도 shipmentRecommendation/priceRecommendationReason(또는 qualityShipmentComment, analysisReason)가
// 아직 자리표시자면 AI 분석이 완료되지 않은 것으로 간주한다 (Swagger 스펙에 별도의 처리 상태 필드는 없음)
function isAnalysisReady(detail: StorageDetail): boolean {
  const hasRecommendedDate = parseIsoDate(detail.shipmentRecommendation) !== null
  const hasReason = resolveText(detail.priceRecommendationReason, '') !== ''
    || resolveText(detail.qualityShipmentComment, '') !== ''
    || resolveText(detail.analysisReason, '') !== ''
  return hasRecommendedDate && hasReason
}

// AI 추천 결과 박스의 근거 텍스트: priceRecommendationReason 최우선, 없으면 qualityShipmentComment → analysisReason 순으로 대체
function resolveRecommendationReason(detail: StorageDetail): string {
  const priceReason = resolveText(detail.priceRecommendationReason, '')
  if (priceReason) return priceReason
  const qualityReason = resolveText(detail.qualityShipmentComment, '')
  if (qualityReason) return qualityReason
  return resolveText(detail.analysisReason, '분석 결과를 준비 중입니다.')
}

const ANALYSIS_POLL_INTERVAL_MS = 2000
const ANALYSIS_POLL_TIMEOUT_MS = 10000

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

// 등급(우수/양호/불량)은 이제 백엔드가 날짜별로 직접 내려준다 (shipmentAnalyses[].qualityStatus)
const TIER_ICONS: Record<string, string> = { 우수: tierExcellentIcon, 양호: tierGoodIcon, 불량: tierPoorIcon }

// 출하일별 분석 카드 1건 — shipmentAnalyses 원본을 화면에 쓰기 좋은 형태로 가공한 결과
type DailyCard = {
  date: Date
  iso: string
  predictedPrice: number | null
  qualityStatus: string
  event: string
}

function toDailyCard(analysis: ShipmentAnalysis): DailyCard | null {
  const date = parseIsoDate(analysis.date)
  if (!date) return null
  return {
    date,
    iso: toIsoDate(date),
    predictedPrice: typeof analysis.predictedPrice === 'number' ? analysis.predictedPrice : null,
    qualityStatus: resolveText(analysis.qualityStatus, ''),
    event: resolveText(analysis.event, ''),
  }
}

// 백엔드가 해당 날짜의 출하일별 분석을 아직 내려주지 않아도 피그마 카드 모양(날짜/상태 태그/가격)이 항상 보이도록 채우는 대체값
const FALLBACK_TIERS = ['우수', '양호', '불량']
const FALLBACK_PRICE = 2341

function buildFallbackDailyCard(date: Date, index: number, forecast: ForecastResponse | null): DailyCard {
  const iso = toIsoDate(date)
  const forecastPrice = forecast?.forecast.find(p => p.date === iso)?.price
    ?? forecast?.history.find(p => p.date === iso)?.price
  return {
    date,
    iso,
    predictedPrice: forecastPrice ?? FALLBACK_PRICE,
    qualityStatus: FALLBACK_TIERS[index % FALLBACK_TIERS.length],
    event: '',
  }
}

// 내일부터 7일 뒤까지 날짜별로 실제 분석 결과가 있으면 그대로, 없으면 대체 카드로 채워 항상 7개 카드를 만든다
function buildDailyCards(detail: StorageDetail | null, forecast: ForecastResponse | null, today: Date): DailyCard[] {
  const analysesByIso = new Map(
    (detail?.shipmentAnalyses ?? [])
      .map(toDailyCard)
      .filter((card): card is DailyCard => card !== null)
      .map(card => [card.iso, card] as const),
  )
  return Array.from({ length: DAILY_CARD_COUNT }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index + 1)
    return analysesByIso.get(toIsoDate(date)) ?? buildFallbackDailyCard(date, index, forecast)
  })
}

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
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [isAlarmOpen, setIsAlarmOpen] = useState(false)
  const [alarmSaved, setAlarmSaved] = useState(false)

  useEffect(() => {
    getMe().then(user => setFarmerName(user.name)).catch(() => setFarmerName(''))
    getMyForecast().then(setForecast).catch(() => setForecast(null))
  }, [])

  useEffect(() => {
    if (storageId == null) {
      setLoadError('저장고 정보가 없습니다. 저장고 현황에서 다시 시도해주세요.')
      return
    }
    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | undefined
    const startedAt = Date.now()

    const poll = async () => {
      setIsLoading(true)
      setLoadError('')
      try {
        setLastAnalyzedStorageId(storageId)
        const result = await startAnalysis(storageId)
        if (cancelled) return
        if (isAnalysisReady(result)) {
          setDetail(result)
          setIsLoading(false)
          return
        }
        if (Date.now() - startedAt >= ANALYSIS_POLL_TIMEOUT_MS) {
          setLoadError('AI 분석이 지연되고 있습니다. 잠시 후 다시 시도해주세요.')
          setIsLoading(false)
          return
        }
        pollTimer = setTimeout(poll, ANALYSIS_POLL_INTERVAL_MS)
      } catch (err) {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'AI 분석에 실패했습니다.')
        setIsLoading(false)
      }
    }

    poll()
    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
    }
  }, [storageId, retryCount])

  const today = useMemo(() => new Date(), [])
  const recommendedCardRef = useRef<HTMLElement | null>(null)

  // 내일(D+1)부터 7일 뒤(D+7)까지 항상 7개 카드를 만든다 (백엔드 데이터가 없는 날짜는 대체 카드로 채움)
  const dailyCards = useMemo(() => buildDailyCards(detail, forecast, today), [detail, forecast, today])
  // 출하 추천일은 shipmentRecommendation("YYYY-MM-DD")을 그대로 사용한다 — 추천일 문자열이 바뀔 때만 새로 계산해 자동 스크롤이 매 렌더마다 재실행되지 않게 한다
  const recommendedDate = useMemo(
    () => (detail ? parseIsoDate(detail.shipmentRecommendation) : null),
    [detail?.shipmentRecommendation],
  )

  // 화면 진입 시 'AI 추천' 뱃지가 달린 카드를 가로 스크롤 영역 중앙으로 자동 이동
  useEffect(() => {
    if (!recommendedDate) return
    recommendedCardRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [recommendedDate])

  // shipmentAnalyses에 해당 날짜 예측가가 없을 때(예: 추천일이 5일 비교 구간 밖인 경우)를 대비해 /price/me 예측을 폴백으로 사용
  const predictedPriceForDate = (date: Date) => {
    const iso = toIsoDate(date)
    const fromAnalysis = detail?.shipmentAnalyses.find(a => a.date === iso)?.predictedPrice
    if (typeof fromAnalysis === 'number') return fromAnalysis
    const point = forecast?.forecast.find(p => p.date === iso) ?? forecast?.history.find(p => p.date === iso)
    return point?.price ?? null
  }

  const metrics = detail ? buildMetrics(detail) : []

  const handleCreateAlarm = async () => {
    if (!recommendedDate) return
    try {
      await createSchedule({ title: '출하 알림', scheduleDate: toIsoDate(recommendedDate) })
      setAlarmSaved(true)
      setIsAlarmOpen(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '알림 등록에 실패했습니다.')
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
          <p>AI 분석 결과를<br />불러오는 중입니다...<br />잠시만 기다려주세요</p>
        </main>
      ) : loadError && !detail ? (
        <main className="m-ai-loading m-ai-load-error">
          <p role="alert">{loadError}</p>
          {storageId != null && (
            <button type="button" className="m-ai-retry-button" onClick={() => setRetryCount(count => count + 1)}>
              다시 시도
            </button>
          )}
        </main>
      ) : (
        <>
          <MobileHeroBanner
            title={farmerName ? `${farmerName} 농가님,` : '농가님,'}
            subtitle={<>현재 보관 중인 {detail?.type ?? '사과'} 사과의<br />최적 출하 시기를 분석했습니다.</>}
          />

          <main className="m-body">
            {actionError && <p role="alert" className="m-error">{actionError}</p>}
            {alarmSaved && <p className="m-ai-alarm-saved">출하 알림이 등록되었습니다.</p>}

            {detail && (
              <>
                <div className="m-ai-storage-box">
                  <span className="m-ai-overview-label">저장고</span>
                  <div className="m-ai-storage-name">{detail.name}</div>
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
                    {recommendedDate ? formatMonthDay(recommendedDate) : '출하 추천일 정보 없음'}
                  </strong>
                </article>

                <article className="m-analysis-card">
                  <span className="m-analysis-badge">AI 추천 결과</span>
                  <p>{highlightAmounts(resolveRecommendationReason(detail))}</p>
                  <button type="button" className="m-market-link-button" onClick={() => navigate('/market')}>
                    시장 가격 예측 보기 →
                  </button>
                </article>

                <h3 className="m-daily-title">출하일 별 분석</h3>
                <div className="m-daily-list">
                  {dailyCards.map(card => {
                    const recommended = recommendedDate ? toIsoDate(recommendedDate) === card.iso : false
                    const tierIcon = card.qualityStatus ? TIER_ICONS[card.qualityStatus] : undefined
                    return (
                      <article
                        className={`m-daily-card ${recommended ? 'recommended' : ''}`}
                        key={card.iso}
                        ref={recommended ? recommendedCardRef : undefined}
                      >
                        {recommended && <span className="m-ai-tag">AI 추천</span>}
                        <strong>{formatMonthDay(card.date)}</strong>
                        {(tierIcon || card.event) && (
                          <div className="m-daily-card-badges">
                            {tierIcon && <img className="m-daily-status-icon" src={tierIcon} alt={card.qualityStatus} />}
                            {card.event && <span className="m-daily-event-tag">{card.event}</span>}
                          </div>
                        )}
                        {card.predictedPrice != null && <b>{card.predictedPrice.toLocaleString()}원 <small>/1kg</small></b>}
                      </article>
                    )
                  })}
                </div>

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

      {isAlarmOpen && recommendedDate && detail && (
        <div className="m-alarm-overlay" onClick={event => event.target === event.currentTarget && setIsAlarmOpen(false)}>
          <div className="m-alarm-modal" role="dialog" aria-modal="true">
            <div className="m-alarm-modal-head">
              <h2>출하 알림 맞추기</h2>
              <button type="button" aria-label="닫기" onClick={() => setIsAlarmOpen(false)}>×</button>
            </div>
            <div className="m-alarm-date-box">
              <span>알림 예정일</span>
              <strong>{formatMonthDayWeekday(recommendedDate)}</strong>
            </div>
            {(predictedPriceForDate(recommendedDate) != null || extractRevenueIncrease(resolveRecommendationReason(detail)) != null) && (
              <div className="m-alarm-stat-grid">
                {predictedPriceForDate(recommendedDate) != null && (
                  <div className="m-alarm-stat-box">
                    <span>예상 가격</span>
                    <strong>{predictedPriceForDate(recommendedDate)?.toLocaleString()}원 <small>/1kg</small></strong>
                  </div>
                )}
                {extractRevenueIncrease(resolveRecommendationReason(detail)) != null && (
                  <div className="m-alarm-stat-box">
                    <span>기대 매출 증가</span>
                    <strong>{extractRevenueIncrease(resolveRecommendationReason(detail))}</strong>
                  </div>
                )}
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
