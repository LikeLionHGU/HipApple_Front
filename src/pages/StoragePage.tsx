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
import './StoragePage.css'

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
  const [storages, setStorages] = useState<StorageSummary[]>([])
  const [selectedStorageId, setSelectedStorageId] = useState<number | null>(null)
  const [detail, setDetail] = useState<StorageDetail | null>(null)
  const [error, setError] = useState('')
  // 저장고 목록 또는 세부 정보를 아직 받지 못한 동안 사과 로딩 화면을 보여준다
  const [isLoading, setIsLoading] = useState(true)

  // 저장고 목록 조회 후 첫 번째 저장고 선택
  useEffect(() => {
    getStorages()
      .then(list => {
        setStorages(list)
        if (list.length > 0) {
          setSelectedStorageId(list[0].storageId)
        } else {
          setIsLoading(false)
        }
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : '저장고 목록을 불러오지 못했습니다.')
        setIsLoading(false)
      })
  }, [])

  // 선택된 저장고의 세부 정보 조회
  useEffect(() => {
    if (selectedStorageId == null) return
    setIsLoading(true)
    getStorage(selectedStorageId)
      .then(setDetail)
      .catch(err => setError(err instanceof Error ? err.message : '저장고 정보를 불러오지 못했습니다.'))
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
