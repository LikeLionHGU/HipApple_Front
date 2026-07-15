import type { ForecastResponse } from '../api/forecast'

// 'YYYY-MM-DD' → 'M/D'
function shortDate(date: string) {
  const parts = date.split(/[-/.]/).map(p => p.trim()).filter(Boolean)
  if (parts.length >= 3) return `${parseInt(parts[1])}/${parseInt(parts[2])}`
  if (parts.length === 2) return `${parseInt(parts[0])}/${parseInt(parts[1])}`
  return date
}

// 실선(실제) + 점선(예측) + 음영밴드(신뢰범위) 차트
export default function ForecastChart({ data }: { data: ForecastResponse }) {
  const history = data.history ?? []
  const forecast = data.forecast ?? []
  const all = [...history, ...forecast]
  if (all.length === 0) return null

  const values = [
    ...history.map(h => h.price),
    ...forecast.flatMap(f => [f.price, f.low, f.high]),
  ]
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const pad10 = Math.max(Math.round((dataMax - dataMin) * 0.1), 50)
  const min = dataMin - pad10
  const max = dataMax + pad10
  const range = max - min || 1

  const w = 720
  const h = 380
  const pad = { top: 24, bottom: 40, left: 60, right: 24 }
  const chartW = w - pad.left - pad.right
  const chartH = h - pad.top - pad.bottom

  const n = all.length
  const toX = (i: number) => pad.left + (i / Math.max(n - 1, 1)) * chartW
  const toY = (v: number) => pad.top + (1 - (v - min) / range) * chartH

  const histLine = history.map((p, i) => `${toX(i)},${toY(p.price)}`).join(' ')

  const lastHistIdx = history.length - 1
  const forecastLine = [
    ...(history.length ? [`${toX(lastHistIdx)},${toY(history[lastHistIdx].price)}`] : []),
    ...forecast.map((p, i) => `${toX(history.length + i)},${toY(p.price)}`),
  ].join(' ')

  const bandTop: string[] = []
  const bandBottom: string[] = []
  if (history.length) {
    const x = toX(lastHistIdx)
    const y = toY(history[lastHistIdx].price)
    bandTop.push(`${x},${y}`)
    bandBottom.push(`${x},${y}`)
  }
  forecast.forEach((p, i) => {
    const x = toX(history.length + i)
    bandTop.push(`${x},${toY(p.high)}`)
    bandBottom.push(`${x},${toY(p.low)}`)
  })
  const bandPath = `M${bandTop.join(' L')} L${bandBottom.reverse().join(' L')} Z`

  const yGrids = [0.25, 0.5, 0.75].map(t => Math.round((min + range * t) / 10) * 10)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="forecast-chart-svg">
      {yGrids.map(v => (
        <g key={v}>
          <line x1={pad.left} x2={pad.left + chartW} y1={toY(v)} y2={toY(v)}
            stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
          <text x={pad.left - 10} y={toY(v) + 5} textAnchor="end"
            fontSize="13" fill="#9CA3AF">{v.toLocaleString()}</text>
        </g>
      ))}

      <path d={bandPath} fill="#1BC485" fillOpacity="0.12" />

      {history.length > 0 && forecast.length > 0 && (
        <line
          x1={toX(lastHistIdx)} x2={toX(lastHistIdx)}
          y1={pad.top} y2={pad.top + chartH}
          stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3 3"
        />
      )}

      <polyline points={forecastLine} fill="none" stroke="#1BC485"
        strokeWidth="2.5" strokeDasharray="6 5"
        strokeLinejoin="round" strokeLinecap="round" />

      <polyline points={histLine} fill="none" stroke="#1BC485"
        strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {history.map((p, i) => (
        <circle key={`h${i}`} cx={toX(i)} cy={toY(p.price)} r="4"
          fill="#1BC485" stroke="#fff" strokeWidth="1.5" />
      ))}
      {forecast.map((p, i) => (
        <circle key={`f${i}`} cx={toX(history.length + i)} cy={toY(p.price)} r="4"
          fill="#fff" stroke="#1BC485" strokeWidth="2" />
      ))}

      {all.map((p, i) => (
        <text key={i} x={toX(i)} y={pad.top + chartH + 22}
          textAnchor="middle" fontSize="12"
          fill={i > lastHistIdx ? '#1BC485' : '#9CA3AF'}>
          {shortDate(p.date)}
        </text>
      ))}
    </svg>
  )
}
