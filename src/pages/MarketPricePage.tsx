import { useCallback, useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ForecastChart from '../components/ForecastChart'
import {
  getForecast,
  getPriceOptions,
  type ForecastResponse,
} from '../api/forecast'
import './MarketPricePage.css'

const formatKoreanDate = (iso: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`
}
const formatMd = (iso: string) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}
const formatMonthDay = (iso: string) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${parseInt(m)}월 ${parseInt(d)}일`
}
const avg = (nums: number[]) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0

// 오늘 날짜 (YYYY-MM-DD)
const todayIso = () => {
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

function MarketPricePage() {
  const [markets, setMarkets] = useState<string[]>([])
  const [varieties, setVarieties] = useState<string[]>([])
  const [market, setMarket] = useState('')
  const [variety, setVariety] = useState('')

  const [data, setData] = useState<ForecastResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchForecast = useCallback(async (m: string, v: string) => {
    if (!m || !v) return
    setLoading(true)
    setError('')
    try {
      setData(await getForecast(m, v))
    } catch {
      setError('예측 데이터를 불러오지 못했습니다. 다른 조합을 선택해 보세요.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // 진입 시 선택지 로드 → 서울가락×후지(없으면 첫 항목)로 초기 조회
  useEffect(() => {
    getPriceOptions()
      .then(opts => {
        setMarkets(opts.markets)
        setVarieties(opts.varieties)
        const m = opts.markets.includes('서울가락') ? '서울가락' : opts.markets[0] ?? ''
        const v = opts.varieties.includes('후지') ? '후지' : opts.varieties[0] ?? ''
        setMarket(m)
        setVariety(v)
        fetchForecast(m, v)
      })
      .catch(() => setError('선택 목록을 불러오지 못했습니다.'))
  }, [fetchForecast])

  const forecast = data?.forecast ?? []
  const history = data?.history ?? []
  const currentPrice = history.length ? history[history.length - 1].price : 0
  const weeklyAvg = avg(forecast.map(f => f.price))
  const overallAvg = avg([...history.map(h => h.price), ...forecast.map(f => f.price)])
  const rangeStart = data?.asOf ?? forecast[0]?.date ?? ''
  const rangeEnd = forecast.length ? forecast[forecast.length - 1].date : ''

  // 예측 데이터 기반 자동 요약 (백엔드가 분석 텍스트를 제공하면 교체 가능)
  const analysisText = (() => {
    if (!data || forecast.length === 0) return ''
    const first = forecast[0].price
    const last = forecast[forecast.length - 1].price
    const dir = last > first ? '상승' : last < first ? '하락' : '보합'
    const lows = Math.min(...forecast.map(f => f.low))
    const highs = Math.max(...forecast.map(f => f.high))
    return `현재 ${data.market} ${data.variety} 도매가는 ${currentPrice.toLocaleString()}원/kg입니다. ` +
      `향후 ${forecast.length}일간 가격이 ${dir}할 것으로 예측되며(${formatMd(forecast[0].date)} ${first.toLocaleString()}원 → ${formatMd(rangeEnd)} ${last.toLocaleString()}원), ` +
      `예측 신뢰 범위는 ${lows.toLocaleString()}~${highs.toLocaleString()}원/kg입니다. 예측은 뒤로 갈수록 오차 범위가 넓어집니다.`
  })()

  return (
    <div className="market-page">
      <Header />

      <main className="market-main">
        <div className="page-header">
          <h1 className="page-title">시장 가격 예측</h1>
          <p className="page-subtitle">향후 일주일의 시장 가격을 확인해보세요</p>
        </div>

        <div className="forecast-filters">
          <div className="filter-top">
            <div className="filter-field">
              <span className="filter-label">오늘</span>
              <div className="filter-box readonly">{formatKoreanDate(todayIso())}</div>
            </div>
            <span className="filter-note">*오늘 기준으로 일주일 후 예상 가격을 제공합니다</span>
          </div>

          <div className="filter-bottom">
            <div className="filter-field">
              <span className="filter-label">시장</span>
              <div className="filter-select-wrap">
                <select value={market} onChange={e => setMarket(e.target.value)}>
                  {markets.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="filter-field">
              <span className="filter-label">품목</span>
              <div className="filter-select-wrap">
                <select value="사과" disabled>
                  <option>사과</option>
                </select>
              </div>
            </div>
            <div className="filter-field">
              <span className="filter-label">품종</span>
              <div className="filter-select-wrap">
                <select value={variety} onChange={e => setVariety(e.target.value)}>
                  {varieties.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <button
              className="forecast-search-btn"
              type="button"
              onClick={() => fetchForecast(market, variety)}
              disabled={loading}
            >
              {loading ? '조회 중...' : '검색하기'}
            </button>
          </div>
        </div>

        {loading && <div className="forecast-status">예측을 불러오는 중입니다...</div>}
        {error && <div className="forecast-status error">{error}</div>}

        {!loading && !error && data && (
          <>
            <div className="search-chip">
              {formatKoreanDate(rangeStart)} ~ {formatKoreanDate(rangeEnd)} · {data.market} · 사과 · {data.variety}
            </div>

            <div className="forecast-body">
              <div className="chart-column">
                <div className="chart-avg">
                  <span className="chart-avg-label">평균</span>
                  <strong className="chart-avg-value">{overallAvg.toLocaleString()}원</strong>
                  <span className="chart-avg-unit">/1kg</span>
                </div>
                <div className="chart-box">
                  {forecast.length || history.length ? (
                    <ForecastChart data={data} />
                  ) : (
                    <div className="forecast-status">표시할 데이터가 없습니다.</div>
                  )}
                </div>
              </div>

              <div className="summary-column">
                <h2 className="summary-title">가격 요약</h2>
                <div className="summary-card">
                  <div className="summary-card-info">
                    <span className="summary-card-label">현재가</span>
                    <span className="summary-card-date green">{formatMonthDay(rangeStart)} 기준</span>
                  </div>
                  <span className="summary-card-value green">{currentPrice.toLocaleString()}원</span>
                </div>
                <div className="summary-card">
                  <div className="summary-card-info">
                    <span className="summary-card-label">주간 평균</span>
                    <span className="summary-card-date">{formatMd(rangeStart)}~{formatMd(rangeEnd)}</span>
                  </div>
                  <span className="summary-card-value">{weeklyAvg.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            <div className="ai-analysis-card">
              <div className="ai-analysis-title">AI 시장 분석</div>
              <p className="ai-analysis-text">{analysisText}</p>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default MarketPricePage
