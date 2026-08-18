import { useCallback, useEffect, useState } from 'react'
import MobileHeader from '../../components/MobileHeader'
import MobileTabBar from '../../components/MobileTabBar'
import MobileHeroBanner from '../../components/MobileHeroBanner'
import ForecastChart from '../../components/ForecastChart'
import Spinner from '../../components/Spinner'
import { getForecast, getPriceOptions, type PriceOptions, type ForecastResponse } from '../../api/forecast'
import { readCache, writeCache } from '../../utils/cache'
import { useLoadingCap } from '../../hooks/useLoadingCap'
import { buildWeekForecast, toIsoDate } from '../../utils/forecast'
import { buildMockForecastResponse } from '../../utils/mockData'
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

const OPTIONS_CACHE_KEY = 'market:options'
const forecastCacheKey = (market: string, variety: string) => `market:forecast:${market}:${variety}`
const pickDefault = (options: string[], preferred: string) => (options.includes(preferred) ? preferred : options[0] ?? '')

function MobileMarketPricePage() {
  // 모듈 top-level이 아니라 마운트 시점에서 읽어야, SPA 내에서 다른 페이지를 갔다가 돌아왔을 때도
  // 그사이 채워진 최신 캐시를 즉시 반영해 전면 로딩이 다시 뜨지 않는다
  const cachedOptions = readCache<PriceOptions>(OPTIONS_CACHE_KEY)
  const initialMarket = cachedOptions ? pickDefault(cachedOptions.markets, '서울가락') : ''
  const initialVariety = cachedOptions ? pickDefault(cachedOptions.varieties, '후지') : ''

  const [markets, setMarkets] = useState<string[]>(cachedOptions?.markets ?? [])
  const [varieties, setVarieties] = useState<string[]>(cachedOptions?.varieties ?? [])
  const [market, setMarket] = useState(initialMarket)
  const [variety, setVariety] = useState(initialVariety)

  const [data, setData] = useState<ForecastResponse | null>(() =>
    initialMarket && initialVariety ? readCache<ForecastResponse>(forecastCacheKey(initialMarket, initialVariety)) : null,
  )
  const [loading, setLoading] = useState(!data)
  const [error, setError] = useState('')

  // 2초가 지나도 응답이 없으면 로딩 화면을 걷어내고, 실제 데이터가 아직 없을 때만 더미 데이터로 차트를 채운다
  useLoadingCap(loading, () => {
    setLoading(false)
    setData(current => current ?? buildMockForecastResponse(market, variety, new Date()))
  })

  // 캐시된 예측 데이터가 있으면 즉시 보여주고, 백엔드 응답은 백그라운드에서 받아 조용히 교체한다(SWR)
  const fetchForecast = useCallback(async (m: string, v: string) => {
    if (!m || !v) return
    const key = forecastCacheKey(m, v)
    const cached = readCache<ForecastResponse>(key)
    if (cached) {
      setData(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }
    setError('')
    try {
      const result = await getForecast(m, v)
      setData(result)
      writeCache(key, result)
    } catch {
      if (!cached) {
        setError('예측 데이터를 불러오지 못했습니다. 다른 조합을 선택해 보세요.')
        setData(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialMarket && initialVariety) fetchForecast(initialMarket, initialVariety)

    getPriceOptions()
      .then(opts => {
        writeCache(OPTIONS_CACHE_KEY, opts)
        setMarkets(opts.markets)
        setVarieties(opts.varieties)
        const m = pickDefault(opts.markets, '서울가락')
        const v = pickDefault(opts.varieties, '후지')
        setMarket(m)
        setVariety(v)
        if (m !== initialMarket || v !== initialVariety) fetchForecast(m, v)
      })
      .catch(() => { if (!cachedOptions) setError('선택 목록을 불러오지 못했습니다.') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchForecast])

  const history = data?.history ?? []
  // 오늘(D-0)부터 6일 뒤(D+6)까지 정확히 7일치만, 날짜 오름차순으로 정제해서 사용한다
  const forecast = data ? buildWeekForecast(data.forecast ?? [], history, new Date()) : []
  const chartData: ForecastResponse | null = data ? { ...data, forecast } : null
  const currentPrice = history.length ? history[history.length - 1].price : 0
  const weeklyAvg = avg(forecast.map(f => f.price))
  const overallAvg = avg([...history.map(h => h.price), ...forecast.map(f => f.price)])
  const rangeStart = forecast[0]?.date ?? toIsoDate(new Date())
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

      <MobileHeroBanner title="판매 수익 예측" subtitle="향후 일주일의 시장 가격을 확인해보세요" />

      <main className="m-body">
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
              {chartData && (forecast.length || history.length) ? (
                <ForecastChart data={chartData} />
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
