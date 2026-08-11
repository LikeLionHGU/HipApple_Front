import { useEffect, useMemo, useState } from 'react'
import MobileHeader from '../../components/MobileHeader'
import MobileTabBar from '../../components/MobileTabBar'
import { getStorages, getMajorSchedules, type StorageSummary, type MajorSchedule } from '../../api/storage'
import { getMe, type UserMe } from '../../api/user'
import { getMonthlySchedules, createSchedule, deleteSchedule, type Schedule } from '../../api/schedule'
import { getPriceHistory, type PricePredictionHistoryResponse, type PricePredictionPeriod } from '../../api/pricePrediction'
import './app.css'
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

function MobileMyPage() {
  const [user, setUser] = useState<UserMe | null>(null)
  const [storages, setStorages] = useState<StorageSummary[]>([])
  const [selectedStorageId, setSelectedStorageId] = useState<number | null>(null)
  const [majorSchedules, setMajorSchedules] = useState<MajorSchedule[]>([])

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
    for (const schedule of schedules) map[schedule.scheduleDate] = [...(map[schedule.scheduleDate] ?? []), schedule]
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
    getPriceHistory({ cropType: '사과', period }).then(setHistory).catch(() => setHistory(null))
  }, [period])

  const summary = useMemo(() => {
    if (!history || history.tableRows.length === 0) return null
    const predicted = history.tableRows.map(r => r.predictedPrice)
    return {
      count: history.tableRows.length,
      max: Math.max(...predicted),
      min: Math.min(...predicted),
      avg: Math.round(predicted.reduce((a, b) => a + b, 0) / predicted.length),
      up: history.tableRows.filter(r => r.changeRate > 0).length,
      down: history.tableRows.filter(r => r.changeRate < 0).length,
    }
  }, [history])

  return (
    <div className="m-app with-tabbar">
      <MobileHeader />

      <section className="m-mypage-hero">
        <h1>마이페이지</h1>
        <p>농가 정보와 일정을 한눈에 확인하세요</p>
      </section>

      <main className="m-body">
        {error && <p role="alert" className="m-error">{error}</p>}

        <section className="m-mypage-card">
          <h2>기본 정보</h2>
          <dl className="m-mypage-info-list">
            <dt>이름</dt>
            <dd>{user?.name ?? '-'}</dd>
            <dt>저장고</dt>
            <dd className="m-mypage-storage-pills">
              {storages.length === 0 && '-'}
              {storages.map(s => (
                <span className="m-mypage-pill" key={s.storageId}>
                  {s.name} · {s.type}
                </span>
              ))}
            </dd>
          </dl>
        </section>

        <section className="m-mypage-card">
          <h2>주요 일정</h2>
          {majorSchedules.length === 0 ? (
            <p className="m-mypage-empty">주요 일정이 없습니다.</p>
          ) : (
            <ul className="m-mypage-major-list">
              {majorSchedules.map(s => (
                <li key={`${s.date}-${s.title}`}>
                  <span className="m-mypage-major-date">{s.date}</span>
                  <span>{s.title}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="m-mypage-card">
          <div className="m-mypage-calendar-head">
            <h2>나의 농가 일정</h2>
            <div className="m-mypage-calendar-nav">
              <button type="button" onClick={() => changeMonth(-1)} aria-label="이전 달">‹</button>
              <strong>{viewYear}년 {viewMonth}월</strong>
              <button type="button" onClick={() => changeMonth(1)} aria-label="다음 달">›</button>
            </div>
          </div>

          <div className="m-mypage-calendar-grid">
            {WEEKDAYS.map(d => <div className="m-mypage-calendar-weekday" key={d}>{d}</div>)}
            {weeks.flatMap((week, wi) => week.map((day, di) => {
              if (day == null) return <div className="m-mypage-calendar-cell empty" key={`${wi}-${di}`} />
              const iso = toIsoDate(new Date(viewYear, viewMonth - 1, day))
              const isToday = iso === toIsoDate(today)
              const daySchedules = schedulesByDate[iso] ?? []
              return (
                <button
                  type="button"
                  className={`m-mypage-calendar-cell ${isToday ? 'today' : ''}`}
                  key={iso}
                  onClick={() => openAddModal(day)}
                >
                  <span className="m-mypage-calendar-day">{day}</span>
                  {daySchedules.length > 0 && <span className="m-mypage-calendar-dot" />}
                </button>
              )
            }))}
          </div>

          {(schedulesByDate[toIsoDate(new Date(viewYear, viewMonth - 1, today.getDate()))] ?? []).length > 0 && (
            <ul className="m-mypage-today-schedules">
              {(schedulesByDate[toIsoDate(new Date(viewYear, viewMonth - 1, today.getDate()))] ?? []).map(s => (
                <li key={s.scheduleId} onClick={() => handleDeleteSchedule(s.scheduleId)}>{s.title}</li>
              ))}
            </ul>
          )}

          <button type="button" className="m-primary-btn m-mypage-add-btn" onClick={() => openAddModal(today.getDate())}>
            일정 추가하기
          </button>
        </section>

        <section className="m-mypage-card">
          <div className="m-mypage-report-head">
            <h2>AI 가격 예측 리포트</h2>
            <button type="button" className="m-mypage-pdf-button" onClick={() => window.print()}>⬇ PDF</button>
          </div>
          <div className="m-mypage-period-tabs">
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

          {summary ? (
            <div className="m-mypage-summary-grid">
              <div><span>AI 분석 횟수</span><strong>{summary.count}회</strong></div>
              <div><span>최고 예측 가격</span><strong>{summary.max.toLocaleString()}원</strong></div>
              <div><span>최저 예측 가격</span><strong>{summary.min.toLocaleString()}원</strong></div>
              <div><span>평균 예측 가격</span><strong>{summary.avg.toLocaleString()}원</strong></div>
              <div><span>가격 상승일 수</span><strong>{summary.up}일</strong></div>
              <div><span>가격 하락일 수</span><strong>{summary.down}일</strong></div>
            </div>
          ) : (
            <p className="m-mypage-empty">표시할 데이터가 없습니다.</p>
          )}

          {history && history.tableRows.length > 0 && (
            <table className="m-mypage-table">
              <thead>
                <tr><th>날짜</th><th>예측</th><th>실제</th><th>변동률</th></tr>
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

        <section className="m-mypage-card">
          <h2>시장 분석 기록</h2>
          {/* 시장 분석 기록 API가 아직 없어, 카드 레이아웃만 유지한 채 플레이스홀더로 대체 */}
          <p className="m-mypage-empty">아직 시장 분석 기록이 없습니다. 데이터가 쌓이면 이곳에 표시돼요.</p>
        </section>

        <section className="m-mypage-card">
          <h2>품질 및 저장 환경 변화</h2>
          {/* 품질/저장환경 리포트 API가 아직 없어, 카드 레이아웃만 유지한 채 플레이스홀더로 대체 */}
          <div className="m-mypage-quality-box">
            <span className="m-mypage-quality-box-label">현재 품질 정보</span>
            <dl>
              <dt>현재 품질 등급</dt><dd>-</dd>
              <dt>품질 점수</dt><dd>-</dd>
              <dt>예상 저장 가능 기간</dt><dd>-</dd>
              <dt>품질 저하 속도</dt><dd>-</dd>
            </dl>
          </div>
        </section>
      </main>

      <MobileTabBar />

      {modalDate && (
        <div className="m-mypage-modal-overlay" onClick={event => event.target === event.currentTarget && setModalDate(null)}>
          <div className="m-mypage-modal" role="dialog" aria-modal="true">
            <div className="m-mypage-modal-head">
              <h2>{formatDot(modalDate)} 일정 추가하기</h2>
              <button type="button" aria-label="닫기" onClick={() => setModalDate(null)}>×</button>
            </div>
            <label className="m-mypage-modal-label" htmlFor="m-mypage-schedule-input">내용을 입력해주세요</label>
            <input
              id="m-mypage-schedule-input"
              className="m-mypage-modal-input"
              placeholder="예 : 출하 전 최종 등급 검사"
              value={modalInput}
              onChange={event => setModalInput(event.target.value)}
              autoFocus
            />
            <div className="m-mypage-modal-buttons">
              <button type="button" className="m-mypage-modal-close" onClick={() => setModalDate(null)}>닫기</button>
              <button type="button" className="m-mypage-modal-confirm" onClick={handleAddSchedule} disabled={!modalInput.trim()}>추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileMyPage
