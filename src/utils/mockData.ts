import type { StorageDetail, StorageSummary, ShipmentAnalysis } from '../api/storage'
import type { ForecastResponse, ForecastPoint, HistoryPoint } from '../api/forecast'
import { toIsoDate } from './forecast'

// 로딩이 지연될 때(캐시도 없고 응답도 늦는 첫 방문) 카드/차트가 빈 레이아웃으로 보이지 않도록
// 화면을 채워두는 자리표시용 더미 데이터. 실제 응답이 도착하는 즉시 그대로 교체된다.

const MOCK_BASE_PRICE = 3200

export function buildMockForecastResponse(market: string, variety: string, today: Date): ForecastResponse {
  const history: HistoryPoint[] = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (4 - i))
    return { date: toIsoDate(date), price: MOCK_BASE_PRICE + Math.round(Math.sin(i) * 80) }
  })
  const forecast: ForecastPoint[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const price = MOCK_BASE_PRICE + Math.round(Math.sin((i + 1) * 0.8) * 120)
    return { date: toIsoDate(date), price, low: price - 150, high: price + 150, horizon: i + 1 }
  })
  return {
    market: market || '서울가락',
    variety: variety || '후지',
    unit: '원/kg',
    asOf: toIsoDate(today),
    generatedAt: toIsoDate(today),
    history,
    forecast,
  }
}

export function buildMockStorageSummary(): StorageSummary {
  return {
    storageId: -1,
    name: '샘플 저장고',
    startDate: Number(toIsoDate(new Date()).replaceAll('-', '')),
    type: '사과',
    storageMethod: 'CA저장',
    brix: 14,
  }
}

export function buildMockStorageDetail(today: Date): StorageDetail {
  const recommend = new Date(today)
  recommend.setDate(recommend.getDate() + 3)

  const shipmentAnalyses: ShipmentAnalysis[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() + i + 1)
    return {
      date: toIsoDate(date),
      predictedPrice: MOCK_BASE_PRICE + Math.round(Math.sin((i + 1) * 0.8) * 120),
      qualityStatus: ['우수', '양호', '불량'][i % 3],
      event: '',
    }
  })

  return {
    storageId: -1,
    name: '샘플 저장고',
    type: '사과',
    startDate: Number(toIsoDate(today).replaceAll('-', '')),
    storeDate: toIsoDate(today),
    storageMethod: 'CA저장',
    brix: 14,
    hardness: 6.5,
    condition: '양호',
    amount: 500,
    preferredDate: toIsoDate(recommend),
    storagePeriodDays: 0,
    temperature: 2,
    humidity: 92,
    ethylene: 0.15,
    qualityStatus: '양호',
    shipmentRecommendation: toIsoDate(recommend),
    analysisReason: '실제 분석 결과를 불러오는 중입니다. 잠시 후 자동으로 교체됩니다.',
    priceRecommendationReason: '실제 분석 결과를 불러오는 중입니다. 잠시 후 자동으로 교체됩니다.',
    shipmentAnalyses,
  }
}
