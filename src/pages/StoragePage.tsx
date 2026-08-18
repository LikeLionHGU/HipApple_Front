import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import HeroBanner from '../components/HeroBanner'
import AppleLoading from '../components/AppleLoading'
import suitableIcon from '../assets/적합.svg'
import cautionIcon from '../assets/주의.svg'
import qualityGoodBadge from '../assets/quality-badge-적합.svg'
import qualityWarningBadge from '../assets/quality-badge-주의.svg'
import { getStorage, getStorages, type StorageDetail, type StorageSummary } from '../api/storage'
import { readCache, writeCache } from '../utils/cache'
import { useLoadingCap } from '../hooks/useLoadingCap'
import { buildMockStorageDetail } from '../utils/mockData'
import './StoragePage.css'

const STORAGES_CACHE_KEY = 'storage:storages'
const storageDetailCacheKey = (id: number) => `storage:detail:${id}`

type StorageStatus = 'good' | 'warning'

type StorageMetric = {
  label: string
  value: string
  description: string
  status: StorageStatus
}

// 저장일(storeDate "2026-07-01T00:00:00" 또는 startDate 20260701)에서 Date를 만든다
function parseStoreDate(detail: StorageDetail): Date | null {
  if (detail.storeDate) {
    const parsed = new Date(detail.storeDate)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const digits = String(detail.startDate ?? '').match(/^(\d{4})(\d{2})(\d{2})$/)
  if (digits) return new Date(Number(digits[1]), Number(digits[2]) - 1, Number(digits[3]))
  return null
}

// 저장일로부터 오늘까지 "보관된" 경과 일수를 브라우저 현재 날짜 기준으로 계산한다.
// 저장일이 오늘이거나 미래면 0일. (DST 영향을 피하려고 UTC 자정 기준으로 일수 차이를 구한다)
function calcStorageDays(detail: StorageDetail): number {
  const target = parseStoreDate(detail)
  if (!target) return 0 // 저장일을 알 수 없으면 0 (백엔드 값에 의존하지 않고 순수 프론트 계산)
  const now = new Date()
  const targetUTC = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((todayUTC - targetUTC) / 86_400_000)
  return Math.max(0, diffDays) // 미래 저장일이면 음수 → 0
}

// 세부 저장고 응답(StorageDetail)을 지표 카드 형태로 변환
function buildMetrics(detail: StorageDetail): StorageMetric[] {
  // 저장기간은 저장일로부터 오늘까지의 경과 일수로 계산한다.
  const storageDays = calcStorageDays(detail)
  return [
    { label: '온도', value: `${detail.temperature}°C`, description: '권장 0~4°C', status: detail.temperature >= 0 && detail.temperature <= 4 ? 'good' : 'warning' },
    { label: '습도', value: `${detail.humidity}%`, description: '권장 90~95%', status: detail.humidity >= 90 && detail.humidity <= 95 ? 'good' : 'warning' },
    { label: '에틸렌', value: `${detail.ethylene}ppm`, description: detail.ethylene >= 0.3 ? '주의 수준 도달' : '정상 수준', status: detail.ethylene >= 0.3 ? 'warning' : 'good' },
    { label: '저장기간', value: `${storageDays}일`, description: '최대 35일 권장', status: storageDays <= 35 ? 'good' : 'warning' },
  ]
}

function formatMeasurementDate(detail: StorageDetail) {
  const source = detail.storeDate
  if (!source) return '측정일 정보 없음'

  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return '측정일 정보 없음'
  return `마지막 측정 ${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

function StoragePage() {
  const navigate = useNavigate()
  // 모듈 top-level이 아니라 마운트 시점(컴포넌트 본문)에서 읽어야, SPA 내에서 다른 페이지를 갔다가
  // 다시 돌아왔을 때도(리로드 없이) 그사이 채워진 최신 캐시를 즉시 반영해 전면 로딩이 다시 뜨지 않는다
  const cachedStorages = readCache<StorageSummary[]>(STORAGES_CACHE_KEY)
  const [storages, setStorages] = useState<StorageSummary[]>(cachedStorages ?? [])
  const [selectedStorageId, setSelectedStorageId] = useState<number | null>(cachedStorages?.[0]?.storageId ?? null)
  const [detail, setDetail] = useState<StorageDetail | null>(() =>
    cachedStorages?.[0] ? readCache<StorageDetail>(storageDetailCacheKey(cachedStorages[0].storageId)) : null,
  )
  const [error, setError] = useState('')
  // 캐시된 데이터가 있으면 전면 로딩 없이 바로 레이아웃을 보여주고, 없으면 최대 2초만 로딩 화면을 유지한다
  const [isLoading, setIsLoading] = useState(!cachedStorages)

  // 2초가 지나도 응답이 없으면 로딩 화면을 걷어내고, 실제 데이터가 아직 없을 때만 더미 데이터로 레이아웃을 채운다
  useLoadingCap(isLoading, () => {
    setIsLoading(false)
    setDetail(current => current ?? buildMockStorageDetail(new Date()))
  })

  // 저장고 목록 조회 후 첫 번째 저장고 선택 (캐시가 있으면 이미 선택돼 있으므로 유지한다)
  useEffect(() => {
    getStorages()
      .then(list => {
        setStorages(list)
        writeCache(STORAGES_CACHE_KEY, list)
        if (list.length > 0) {
          setSelectedStorageId(current => current ?? list[0].storageId)
        } else {
          // 저장고가 실제로 하나도 없는 것으로 확인됐다면, 그사이 채워졌을 수 있는 더미 데이터를 지운다
          setDetail(null)
          setIsLoading(false)
        }
      })
      .catch(err => {
        if (storages.length === 0) setError(err instanceof Error ? err.message : '저장고 목록을 불러오지 못했습니다.')
        setIsLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 선택된 저장고의 세부 정보 조회 — 캐시된 값이 있으면 즉시 보여주고 백그라운드에서 최신 데이터로 교체한다(SWR)
  useEffect(() => {
    if (selectedStorageId == null) return
    const cachedDetail = readCache<StorageDetail>(storageDetailCacheKey(selectedStorageId))
    if (cachedDetail) {
      setDetail(cachedDetail)
    } else {
      setIsLoading(true)
    }
    getStorage(selectedStorageId)
      .then(result => {
        setDetail(result)
        writeCache(storageDetailCacheKey(selectedStorageId), result)
      })
      .catch(err => {
        if (!cachedDetail) setError(err instanceof Error ? err.message : '저장고 정보를 불러오지 못했습니다.')
      })
      .finally(() => setIsLoading(false))
  }, [selectedStorageId])

  const metrics = useMemo(() => (detail ? buildMetrics(detail) : []), [detail])
  const hasWarning = metrics.some(metric => metric.status === 'warning')

  return (
    <div className="storage-page">
      <Header />

      {isLoading ? (
        <AppleLoading message={<>저장고 정보를 불러오는 중입니다...<br />잠시만 기다려주세요</>} />
      ) : (
        <>
          <HeroBanner title="저장고 현황" subtitle="저장고의 현재 상태를 한눈에 확인하세요." />

          <main className="storage-main">
            {error && <p role="alert" className="storage-error">{error}</p>}

            <section className="storage-overview" aria-label="저장고 상태 요약">
              <div className="storage-selector">
                <label htmlFor="storage-select">저장고</label>
                <select
                  id="storage-select"
                  value={selectedStorageId ?? ''}
                  onChange={event => setSelectedStorageId(Number(event.target.value))}
                >
                  {storages.map(storage => (
                    <option key={storage.storageId} value={storage.storageId}>
                      {storage.name}
                    </option>
                  ))}
                </select>
                <button
                  className="storage-info-link"
                  type="button"
                  onClick={() => navigate('/storage/info')}
                >
                  저장고 목록
                </button>
              </div>

              <div className="metrics-area">
                <div className="metrics-heading">
                  <h2>현재 저장 현황</h2>
                  <time dateTime={detail?.storeDate}>
                    {detail ? formatMeasurementDate(detail) : '측정일 정보 없음'}
                  </time>
                </div>
                <div className="metric-grid">
                  {metrics.map(metric => (
                    <article className="metric-card" key={metric.label}>
                      <div className="metric-card-topline">
                        <h3>{metric.label}</h3>
                        <img
                          className="status-icon"
                          src={metric.status === 'good' ? suitableIcon : cautionIcon}
                          alt={metric.status === 'good' ? '적합' : '주의'}
                        />
                      </div>
                      <strong>{metric.value}</strong>
                      <p>{metric.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="quality-panel" aria-labelledby="quality-title">
              <div className="quality-title-row">
                <h2 id="quality-title">저장 품질 상태</h2>
                <img
                  className="quality-badge"
                  src={hasWarning ? qualityWarningBadge : qualityGoodBadge}
                  alt={hasWarning ? '주의' : '적합'}
                />
              </div>
              {hasWarning ? (
                <p>
                  에틸렌 농도가 주의 수준(0.3ppm)에 도달했습니다.<br />
                  장기 저장 시 품질 저하 가능성이 있으며, 빠른 출하를 검토하시기 바랍니다.
                </p>
              ) : (
                <p>현재 저장 환경이 권장 기준을 충족하고 있습니다.</p>
              )}
            </section>

            <div className="storage-cta">
              <p className="storage-cta-hint">*사진을 올리면 AI가 더 정확하게 분석해드려요</p>
              <div className="storage-cta-buttons">
                <button
                  className="photo-upload-button"
                  type="button"
                  onClick={() => navigate('/storage/photo-upload', { state: { storageId: selectedStorageId, storageName: detail?.name } })}
                >
                  사진 업로드하기
                </button>
                <button
                  className="ai-recommend-button"
                  type="button"
                  onClick={() => navigate('/storage/ai', { state: { storageId: selectedStorageId } })}
                >
                  AI 추천 받기
                </button>
              </div>
            </div>
          </main>
        </>
      )}
      <Footer />
    </div>
  )
}

export default StoragePage
