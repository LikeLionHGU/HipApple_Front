import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import HeroBanner from '../components/HeroBanner'
import {
  getStorage,
  getStorages,
  getMajorSchedules,
  getQualityStorageStatus,
  type StorageDetail,
  type StorageSummary,
  type MajorSchedule,
  type QualityStorageStatusResponse,
  type QualityTrendPoint,
} from '../api/storage'
import { getMe, type UserMe } from '../api/user'
import { getMonthlySchedules, createSchedule, deleteSchedule, type Schedule } from '../api/schedule'
import {
  getPriceHistory,
  type PricePredictionHistoryResponse,
  type PricePredictionChartPoint,
  type PricePredictionTableRow,
  type PricePredictionPeriod,
} from '../api/pricePrediction'
import './MyPage.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const PERIOD_TABS: { key: PricePredictionPeriod; label: string }[] = [
  { key: 'ONE_MONTH', label: '1개월' },
  { key: 'SIX_MONTHS', label: '6개월' },
  { key: 'ONE_YEAR', label: '1년' },
]

function toIsoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDot(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${y}.${m}.${d}`
}

// 달력에 표시할 주 단위 날짜 그리드(빈 칸은 null)를 만든다
function buildCalendarWeeks(year: number, month: number): (number | null)[][] {
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// trendData가 비어있을 때(분석 이력 없음) 카드 모양만 유지하는 플레이스홀더
function QualityTrendPlaceholder() {
  const width = 280
  const height = 90
  const y = height / 2
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mypage-quality-chart-svg">
      <line x1="0" y1={y} x2={width} y2={y} stroke="#e5e7eb" strokeWidth="2" strokeDasharray="6 6" />
    </svg>
  )
}

// 품질 점수 변화 추이 그래프 (리포트 "3. 품질 및 저장 환경 변화")
function QualityTrendChart({ data }: { data: QualityTrendPoint[] }) {
  if (data.length === 0) return <QualityTrendPlaceholder />

  const width = 280
  const height = 100
  const padding = { top: 10, right: 8, bottom: 20, left: 8 }
  const scores = data.map(p => p.score)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1

  const toX = (i: number) => padding.left + (i / Math.max(1, data.length - 1)) * (width - padding.left - padding.right)
  const toY = (v: number) => padding.top + (1 - (v - min) / range) * (height - padding.top - padding.bottom)
  const linePoints = data.map((p, i) => `${toX(i)},${toY(p.score)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mypage-quality-chart-svg">
      <polyline points={linePoints} fill="none" stroke="#15dc92" strokeWidth="2" />
      {data.map((p, i) => <circle key={p.date} cx={toX(i)} cy={toY(p.score)} r="3" fill="#15dc92" />)}
      {data.map((p, i) => (
        <text key={p.date} x={toX(i)} y={height - 4} fontSize="9" fill="#9ca3af" textAnchor="middle">
          {p.date.slice(5)}
        </text>
      ))}
    </svg>
  )
}

// 피그마 디자인 스펙의 "1. AI 가격 예측 이력" 6개월 예시 곡선 — 오늘 날짜 기준 상대 오프셋으로 재구성해 하드코딩 날짜 없이 재사용한다
const MOCK_PRICE_ANCHORS: { daysAgoRatio: number; predictedPrice: number; actualPrice: number }[] = [
  { daysAgoRatio: 1, predictedPrice: 3850, actualPrice: 3720 },
  { daysAgoRatio: 0.75, predictedPrice: 4120, actualPrice: 3980 },
  { daysAgoRatio: 0.5, predictedPrice: 4530, actualPrice: 4210 },
  { daysAgoRatio: 0.25, predictedPrice: 4910, actualPrice: 4560 },
  { daysAgoRatio: 0, predictedPrice: 4780, actualPrice: 4430 },
]

const MOCK_PERIOD_SPAN_DAYS: Record<PricePredictionPeriod, number> = {
  ONE_MONTH: 30,
  SIX_MONTHS: 180,
  ONE_YEAR: 360,
}

// 백엔드 응답이 비어있거나 실패했을 때만 사용하는 Fallback — 피그마 레이아웃(차트+표)이 항상 노출되도록 채운다
function buildMockPriceHistory(period: PricePredictionPeriod, today: Date): PricePredictionHistoryResponse {
  const spanDays = MOCK_PERIOD_SPAN_DAYS[period]
  const anchors = MOCK_PRICE_ANCHORS.map(anchor => {
    const daysAgo = Math.round(anchor.daysAgoRatio * spanDays)
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo)
    return { date: toIsoDate(date), predictedPrice: anchor.predictedPrice, actualPrice: anchor.actualPrice }
  })

  const tableRows: PricePredictionTableRow[] = anchors.map((point, index) => {
    const prevPrice = anchors[index - 1]?.predictedPrice
    const changeRate = prevPrice ? Number((((point.predictedPrice - prevPrice) / prevPrice) * 100).toFixed(1)) : 0
    return { ...point, changeRate }
  })

  // 앵커 사이를 선형 보간해 차트 라인을 부드럽게 채운다
  const STEPS_PER_SEGMENT = 4
  const chartPoints: PricePredictionChartPoint[] = []
  for (let i = 0; i < anchors.length - 1; i++) {
    const from = anchors[i]
    const to = anchors[i + 1]
    const fromTime = new Date(from.date).getTime()
    const toTime = new Date(to.date).getTime()
    for (let step = 0; step < STEPS_PER_SEGMENT; step++) {
      const t = step / STEPS_PER_SEGMENT
      chartPoints.push({
        date: toIsoDate(new Date(fromTime + (toTime - fromTime) * t)),
        predictedPrice: Math.round(from.predictedPrice + (to.predictedPrice - from.predictedPrice) * t),
        actualPrice: Math.round(from.actualPrice + (to.actualPrice - from.actualPrice) * t),
      })
    }
  }
  chartPoints.push(anchors[anchors.length - 1])

  return { chartPoints, tableRows }
}

function PricePredictionChart({ data }: { data: PricePredictionHistoryResponse }) {
  const points = data.chartPoints
  if (points.length === 0) return <p className="mypage-chart-empty">표시할 데이터가 없습니다.</p>

  const width = 640
  const height = 220
  const padding = { top: 16, right: 16, bottom: 28, left: 56 }
  const values = points.flatMap(p => [p.predictedPrice, p.actualPrice]).filter(v => v != null) as number[]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const toX = (i: number) => padding.left + (i / Math.max(1, points.length - 1)) * (width - padding.left - padding.right)
  const toY = (v: number) => padding.top + (1 - (v - min) / range) * (height - padding.top - padding.bottom)

  const predictedLine = points.map((p, i) => `${toX(i)},${toY(p.predictedPrice)}`).join(' ')
  const actualLine = points.map((p, i) => `${toX(i)},${toY(p.actualPrice)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mypage-chart">
      <polyline points={predictedLine} fill="none" stroke="#15dc92" strokeWidth="2.5" />
      <polyline points={actualLine} fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="5 4" />
      {points.map((p, i) => (
        <text key={p.date} x={toX(i)} y={height - 6} fontSize="10" fill="#9ca3af" textAnchor="middle">
          {p.date.slice(5)}
        </text>
      ))}
    </svg>
  )
}

function MyPage() {
  const [user, setUser] = useState<UserMe | null>(null)
  const [storages, setStorages] = useState<StorageSummary[]>([])
  const [selectedStorageId, setSelectedStorageId] = useState<number | null>(null)
  const [majorSchedules, setMajorSchedules] = useState<MajorSchedule[]>([])
  const [detail, setDetail] = useState<StorageDetail | null>(null)
  const [qualityStatus, setQualityStatus] = useState<QualityStorageStatusResponse | null>(null)

  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [modalDate, setModalDate] = useState<string | null>(null)
  const [modalInput, setModalInput] = useState('')

  const [period, setPeriod] = useState<PricePredictionPeriod>('SIX_MONTHS')
  const [history, setHistory] = useState<PricePredictionHistoryResponse | null>(null)

  const [error, setError] = useState('')

  useEffect(() => {
    getMe().then(setUser).catch(() => setUser(null))
    getStorages()
      .then(list => {
        setStorages(list)
        if (list.length > 0) setSelectedStorageId(list[0].storageId)
      })
      .catch(err => setError(err instanceof Error ? err.message : '저장고 목록을 불러오지 못했습니다.'))
  }, [])

  useEffect(() => {
    if (selectedStorageId == null) return
    getMajorSchedules(selectedStorageId).then(setMajorSchedules).catch(() => setMajorSchedules([]))
    // '4. 분석 기간 요약'에 바인딩할 AI 분석/저장 환경 요약(periodSummary)을 함께 조회한다
    getStorage(selectedStorageId).then(setDetail).catch(() => setDetail(null))
    // '3. 품질 및 저장 환경 변화'에 바인딩할 품질 점수 추이/현재 품질 정보를 조회한다
    getQualityStorageStatus(selectedStorageId).then(setQualityStatus).catch(() => setQualityStatus(null))
  }, [selectedStorageId])

  const refetchSchedules = () => {
    getMonthlySchedules(viewYear, viewMonth).then(setSchedules).catch(() => setSchedules([]))
  }

  useEffect(() => {
    refetchSchedules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth])

  const schedulesByDate = useMemo(() => {
    const map: Record<string, Schedule[]> = {}
    for (const schedule of schedules) {
      const key = schedule.scheduleDate
      map[key] = [...(map[key] ?? []), schedule]
    }
    return map
  }, [schedules])

  const weeks = useMemo(() => buildCalendarWeeks(viewYear, viewMonth), [viewYear, viewMonth])

  const changeMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth - 1 + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth() + 1)
  }

  const openAddModal = (day: number) => {
    setModalDate(toIsoDate(new Date(viewYear, viewMonth - 1, day)))
    setModalInput('')
  }

  const handleAddSchedule = async () => {
    if (!modalDate || !modalInput.trim()) return
    try {
      await createSchedule({ title: modalInput.trim(), scheduleDate: modalDate })
      setModalDate(null)
      refetchSchedules()
    } catch (err) {
      setError(err instanceof Error ? err.message : '일정 추가에 실패했습니다.')
    }
  }

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!window.confirm('이 일정을 삭제할까요?')) return
    try {
      await deleteSchedule(scheduleId)
      refetchSchedules()
    } catch (err) {
      setError(err instanceof Error ? err.message : '일정 삭제에 실패했습니다.')
    }
  }

  useEffect(() => {
    getPriceHistory({ period })
      .then(result => {
        const hasData = result.chartPoints.length > 0 || result.tableRows.length > 0
        setHistory(hasData ? result : buildMockPriceHistory(period, today))
      })
      .catch(() => setHistory(buildMockPriceHistory(period, today)))
  }, [period, today])

  const aiAnalysisSummary = detail?.periodSummary?.aiAnalysisSummary
  const storageEnvironmentSummary = detail?.periodSummary?.storageEnvironmentSummary
  const marketAnalysisRecords = detail?.marketAnalysisRecords ?? []

  return (
    <div className="mypage">
      <Header />

      <HeroBanner title="마이페이지" subtitle="농가 정보와 일정을 한눈에 확인하고, 분석 리포트를 생성할 수 있어요" />

      <main className="mypage-main">
        {error && <p role="alert" className="mypage-error">{error}</p>}

        <div className="mypage-top-grid">
          <div className="mypage-side">
            <section className="mypage-card">
              <h2>기본 정보</h2>
              <dl className="mypage-info-list">
                <dt>이름</dt>
                <dd>{user?.name ?? '-'}</dd>
                <dt>저장고</dt>
                <dd className="mypage-storage-pills">
                  {storages.length === 0 && '-'}
                  {storages.map(s => (
                    <span className="mypage-pill" key={s.storageId}>
                      {s.name} · {s.type}
                    </span>
                  ))}
                </dd>
              </dl>
            </section>

            <section className="mypage-card">
              <h2>주요 일정</h2>
              {majorSchedules.length === 0 ? (
                <p className="mypage-empty">주요 일정이 없습니다.</p>
              ) : (
                <ul className="mypage-major-list">
                  {majorSchedules.map(s => (
                    <li key={`${s.date}-${s.title}`}>
                      <span className="mypage-major-date">{s.date}</span>
                      <span>{s.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="mypage-calendar-card">
            <div className="mypage-calendar-head">
              <h2>나의 농가 일정</h2>
              <div className="mypage-calendar-nav">
                <button type="button" onClick={() => changeMonth(-1)} aria-label="이전 달">‹</button>
                <strong>{viewYear}년 {viewMonth}월</strong>
                <button type="button" onClick={() => changeMonth(1)} aria-label="다음 달">›</button>
              </div>
            </div>

            <div className="mypage-calendar-grid">
              {WEEKDAYS.map(d => <div className="mypage-calendar-weekday" key={d}>{d}</div>)}
              {weeks.flatMap((week, wi) => week.map((day, di) => {
                if (day == null) return <div className="mypage-calendar-cell empty" key={`${wi}-${di}`} />
                const iso = toIsoDate(new Date(viewYear, viewMonth - 1, day))
                const isToday = iso === toIsoDate(today)
                const daySchedules = schedulesByDate[iso] ?? []
                return (
                  <button
                    type="button"
                    className={`mypage-calendar-cell ${isToday ? 'today' : ''}`}
                    key={iso}
                    onClick={() => openAddModal(day)}
                  >
                    <span className="mypage-calendar-day">{day}</span>
                    {daySchedules.map(s => (
                      <span
                        className="mypage-calendar-tag"
                        key={s.scheduleId}
                        onClick={event => { event.stopPropagation(); handleDeleteSchedule(s.scheduleId) }}
                        title="클릭하면 삭제됩니다"
                      >
                        {s.title}
                      </span>
                    ))}
                  </button>
                )
              }))}
            </div>

            <button type="button" className="mypage-add-schedule-button" onClick={() => openAddModal(today.getDate())}>
              일정 추가하기
            </button>
          </section>
        </div>

        <section className="mypage-report">
          <div className="mypage-report-head">
            <div>
              <h2>지금까지의 저장 기록과 시장 데이터를<br />리포트로 확인하세요</h2>
            </div>
            <div className="mypage-report-actions">
              <div className="mypage-report-date">
                <span>리포트 생성일</span>
                <strong>{toIsoDate(today).replaceAll('-', '.')}</strong>
              </div>
              <div className="mypage-period-tabs">
                {PERIOD_TABS.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    className={period === tab.key ? 'active' : ''}
                    onClick={() => setPeriod(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button type="button" className="mypage-pdf-button" onClick={() => window.print()}>
                ⬇ PDF 다운로드
              </button>
            </div>
          </div>

          <div className="mypage-report-grid">
            <section className="mypage-report-panel">
              <h3>1. AI 가격 예측 이력</h3>
              <div className="mypage-chart-legend">
                <span><i className="solid" /> 예측 가격</span>
                <span><i className="dashed" /> 실제 평균 가격(참고)</span>
              </div>
              {history ? <PricePredictionChart data={history} /> : <p className="mypage-empty">불러오는 중...</p>}
              {history && history.tableRows.length > 0 && (
                <table className="mypage-table">
                  <thead>
                    <tr><th>날짜</th><th>예측(원/kg)</th><th>실제(원/kg)</th><th>변동률</th></tr>
                  </thead>
                  <tbody>
                    {history.tableRows.map(row => (
                      <tr key={row.date}>
                        <td>{formatDot(row.date)}</td>
                        <td>{row.predictedPrice.toLocaleString()}</td>
                        <td>{row.actualPrice.toLocaleString()}</td>
                        <td className={row.changeRate > 0 ? 'up' : row.changeRate < 0 ? 'down' : ''}>
                          {row.changeRate > 0 ? '▲' : row.changeRate < 0 ? '▼' : '-'} {Math.abs(row.changeRate).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="mypage-report-panel mypage-market-panel">
              <h3>2. 시장 분석 기록</h3>
              {marketAnalysisRecords.length === 0 ? (
                <p className="mypage-empty">아직 시장 분석 기록이 없습니다. 데이터가 쌓이면 이곳에 표시돼요.</p>
              ) : (
                <ul className="mypage-market-list">
                  {marketAnalysisRecords.map(record => (
                    <li className="mypage-market-item" key={`${record.date}-${record.content}`}>
                      <span className="mypage-market-date">{record.date}</span>
                      <p className="mypage-market-content">{record.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mypage-report-panel mypage-quality-panel">
              <h3>3. 품질 및 저장 환경 변화</h3>
              <div className="mypage-quality-body">
                <div className="mypage-quality-chart">
                  <span className="mypage-quality-chart-label">품질 점수 변화 추이</span>
                  <QualityTrendChart data={qualityStatus?.trendData ?? []} />
                </div>
                <div className="mypage-quality-box">
                  <span className="mypage-quality-box-label">현재 품질 정보</span>
                  <dl>
                    <dt>현재 품질 등급</dt><dd>{qualityStatus?.currentMetrics.grade ?? '-'}</dd>
                    <dt>품질 점수</dt>
                    <dd>{qualityStatus ? `${qualityStatus.currentMetrics.score}/${qualityStatus.currentMetrics.maxScore}` : '-'}</dd>
                    <dt>예상 저장 가능 기간</dt>
                    <dd>{qualityStatus ? `${qualityStatus.currentMetrics.estimatedStorageDays}일` : '-'}</dd>
                    <dt>품질 저하 속도</dt><dd>{qualityStatus?.currentMetrics.degradationSpeed ?? '-'}</dd>
                  </dl>
                </div>
              </div>
            </section>

            <section className="mypage-report-panel">
              <h3>4. 분석 기간 요약</h3>
              {aiAnalysisSummary || storageEnvironmentSummary ? (
                <div className="mypage-period-summary">
                  <div className="mypage-period-summary-col">
                    <span className="mypage-period-summary-title">AI 분석 요약</span>
                    <dl>
                      <div><dt>AI 분석 횟수</dt><dd>{aiAnalysisSummary ? `${aiAnalysisSummary.analysisCount}회` : '-'}</dd></div>
                      <div><dt>AI 출하 추천 횟수</dt><dd>{aiAnalysisSummary ? `${aiAnalysisSummary.shipmentRecommendationCount}회` : '-'}</dd></div>
                      <div><dt>최고 예측 가격</dt><dd>{aiAnalysisSummary ? `${aiAnalysisSummary.maxPredictedPrice.toLocaleString()}원/kg` : '-'}</dd></div>
                      <div><dt>최저 예측 가격</dt><dd>{aiAnalysisSummary ? `${aiAnalysisSummary.minPredictedPrice.toLocaleString()}원/kg` : '-'}</dd></div>
                      <div><dt>평균 예측 가격</dt><dd>{aiAnalysisSummary ? `${aiAnalysisSummary.avgPredictedPrice.toLocaleString()}원/kg` : '-'}</dd></div>
                      <div><dt>가격 상승일 수</dt><dd>{aiAnalysisSummary ? `${aiAnalysisSummary.priceIncreaseDays}일` : '-'}</dd></div>
                      <div><dt>가격 하락일 수</dt><dd>{aiAnalysisSummary ? `${aiAnalysisSummary.priceDecreaseDays}일` : '-'}</dd></div>
                    </dl>
                  </div>
                  <div className="mypage-period-summary-col">
                    <span className="mypage-period-summary-title">저장 환경 요약</span>
                    <dl>
                      <div><dt>평균 온도</dt><dd>{storageEnvironmentSummary ? `${storageEnvironmentSummary.avgTemperature}°C` : '-'}</dd></div>
                      <div><dt>평균 습도</dt><dd>{storageEnvironmentSummary ? `${storageEnvironmentSummary.avgHumidity}%` : '-'}</dd></div>
                      <div><dt>평균 CO2</dt><dd>{storageEnvironmentSummary ? `${storageEnvironmentSummary.avgCo2}ppm` : '-'}</dd></div>
                      <div><dt>온도 임계값 이탈</dt><dd>{storageEnvironmentSummary ? `${storageEnvironmentSummary.tempDeviationCount}회` : '-'}</dd></div>
                      <div><dt>습도 임계값 이탈</dt><dd>{storageEnvironmentSummary ? `${storageEnvironmentSummary.humidityDeviationCount}회` : '-'}</dd></div>
                      <div><dt>CO2 이상 감지</dt><dd>{storageEnvironmentSummary ? `${storageEnvironmentSummary.co2AnomalyCount}회` : '-'}</dd></div>
                      <div><dt>환경 안정성 점수</dt><dd>{storageEnvironmentSummary ? `${storageEnvironmentSummary.environmentStabilityScore}/100` : '-'}</dd></div>
                    </dl>
                  </div>
                </div>
              ) : (
                <p className="mypage-empty">표시할 데이터가 없습니다.</p>
              )}
            </section>
          </div>
        </section>
      </main>

      <Footer />

      {modalDate && (
        <div className="mypage-modal-overlay" onClick={event => event.target === event.currentTarget && setModalDate(null)}>
          <div className="mypage-modal" role="dialog" aria-modal="true">
            <div className="mypage-modal-head">
              <h2>{formatDot(modalDate)} 일정 추가하기</h2>
              <button type="button" aria-label="닫기" onClick={() => setModalDate(null)}>×</button>
            </div>
            <label className="mypage-modal-label" htmlFor="mypage-schedule-input">내용을 입력해주세요</label>
            <input
              id="mypage-schedule-input"
              className="mypage-modal-input"
              placeholder="예 : 출하 전 최종 등급 검사"
              value={modalInput}
              onChange={event => setModalInput(event.target.value)}
              autoFocus
            />
            <div className="mypage-modal-buttons">
              <button type="button" className="mypage-modal-close" onClick={() => setModalDate(null)}>닫기</button>
              <button type="button" className="mypage-modal-confirm" onClick={handleAddSchedule} disabled={!modalInput.trim()}>추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyPage
