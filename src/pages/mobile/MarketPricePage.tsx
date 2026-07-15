import { useCallback, useEffect, useState } from 'react'
import MobileHeader from '../../components/MobileHeader'
import MobileTabBar from '../../components/MobileTabBar'
import ForecastChart from '../../components/ForecastChart'
import Spinner from '../../components/Spinner'
import { getForecast, getPriceOptions, type ForecastResponse } from '../../api/forecast'
import './app.css'
import './MarketPricePage.css'

const formatMonthDay = (iso: string) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${parseInt(m)}월 ${parseInt(d)}일`
}
const formatMd = (iso: string) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}
const avg = (nums: number[]) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0

function MobileMarketPricePage() {
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

  const analysisText = (() => {
    if (!data || forecast.length === 0) return ''
    const first = forecast[0].price
    const last = forecast[forecast.length - 1].price
    const dir = last > first ? '상승' : last < first ? '하락' : '보합'
    const lows = Math.min(...forecast.map(f => f.low))
    const highs = Math.max(...forecast.map(f => f.high))
    return `현재 ${data.market} ${data.variety} 도매가는 ${currentPrice.toLocaleString()}원/kg입니다. ` +
      `향후 ${forecast.length}일간 ${dir}할 것으로 예측되며, 예측 신뢰 범위는 ${lows.toLocaleString()}~${highs.toLocaleString()}원/kg입니다.`
  })()

  return (
    <div className="m-app with-tabbar">
      <MobileHeader />

      <main className="m-body">
        <h1 className="m-page-title">시장 가격 예측</h1>
        <p className="m-page-sub">향후 일주일의 시장 가격을 확인해보세요</p>

        <div className="m-field">
          <span className="m-field-label">시장</span>
          <select className="m-select" value={market} onChange={e => setMarket(e.target.value)}>
            {markets.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="m-field">
          <span className="m-field-label">품종</span>
          <select className="m-select" value={variety} onChange={e => setVariety(e.target.value)}>
            {varieties.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <button
          className="m-primary-btn"
          type="button"
          onClick={() => fetchForecast(market, variety)}
          disabled={loading}
        >
          {loading ? <Spinner size={20} className="spinner-inline" /> : '검색하기'}
        </button>

        {loading && <div className="m-status"><Spinner label="예측을 불러오는 중입니다..." /></div>}
        {error && <div className="m-status error">{error}</div>}

        {!loading && !error && data && (
          <>
            <div className="m-search-chip">
              {formatMonthDay(rangeStart)} ~ {formatMonthDay(rangeEnd)} · {data.market} · 사과 · {data.variety}
            </div>

            <div className="m-chart-avg">
              <span>평균</span>
              <strong>{overallAvg.toLocaleString()}원</strong>
              <small>/1kg</small>
            </div>
            <div className="m-chart-box">
              {forecast.length || history.length ? (
                <ForecastChart data={data} />
              ) : (
                <div className="m-status">표시할 데이터가 없습니다.</div>
              )}
            </div>

            <div className="m-summary-cards">
              <div className="m-summary-card">
                <div>
                  <span className="m-summary-label">현재가</span>
                  <span className="m-summary-date green">{formatMonthDay(rangeStart)} 기준</span>
                </div>
                <strong className="green">{currentPrice.toLocaleString()}원</strong>
              </div>
              <div className="m-summary-card">
                <div>
                  <span className="m-summary-label">주간 평균</span>
                  <span className="m-summary-date">{formatMd(rangeStart)}~{formatMd(rangeEnd)}</span>
                </div>
                <strong>{weeklyAvg.toLocaleString()}원</strong>
              </div>
            </div>

            <div className="m-ai-analysis">
              <div className="m-ai-analysis-title">AI 시장 분석</div>
              <p>{analysisText}</p>
            </div>
          </>
        )}
      </main>

      <MobileTabBar />
    </div>
  )
}

export default MobileMarketPricePage
