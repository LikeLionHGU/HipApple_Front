import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/MobileHeader'
import MobileTabBar from '../../components/MobileTabBar'
import AppleLoading from '../../components/AppleLoading'
import suitableIcon from '../../assets/적합.svg'
import cautionIcon from '../../assets/주의.svg'
import { getStorage, getStorages, type StorageDetail, type StorageSummary } from '../../api/storage'
import './app.css'
import './StoragePage.css'

type StorageStatus = 'good' | 'warning'
type StorageMetric = { label: string; value: string; description: string; status: StorageStatus }

// 저장일(storeDate 또는 startDate)에서 Date를 만든다
function parseStoreDate(detail: StorageDetail): Date | null {
  if (detail.storeDate) {
    const parsed = new Date(detail.storeDate)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const digits = String(detail.startDate ?? '').match(/^(\d{4})(\d{2})(\d{2})$/)
  if (digits) return new Date(Number(digits[1]), Number(digits[2]) - 1, Number(digits[3]))
  return null
}

// 저장일로부터 오늘까지의 경과 일수를 브라우저 현재 날짜 기준으로 계산한다.
function calcStorageDays(detail: StorageDetail): number {
  const target = parseStoreDate(detail)
  if (!target) return 0
  const now = new Date()
  const targetUTC = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.floor((todayUTC - targetUTC) / 86_400_000))
}

function buildMetrics(detail: StorageDetail): StorageMetric[] {
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
  return `측정 ${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

function MobileStoragePage() {
  const navigate = useNavigate()
  const [storages, setStorages] = useState<StorageSummary[]>([])
  const [selectedStorageId, setSelectedStorageId] = useState<number | null>(null)
  const [detail, setDetail] = useState<StorageDetail | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    if (selectedStorageId == null) return
    setIsLoading(true)
    getStorage(selectedStorageId)
      .then(setDetail)
      .catch(err => setError(err instanceof Error ? err.message : '저장고 정보를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false))
  }, [selectedStorageId])

  const metrics = useMemo(() => (detail ? buildMetrics(detail) : []), [detail])
  const hasWarning = metrics.some(m => m.status === 'warning')

  return (
    <div className="m-app with-tabbar">
      <MobileHeader />

      {isLoading ? (
        <AppleLoading compact message={<>저장고 정보를 불러오는 중입니다...<br />잠시만 기다려주세요</>} />
      ) : (
        <>
          <section className="m-page-hero">
            <h1 className="m-page-title">저장고 현황</h1>
            <p className="m-page-sub">저장고의 현재 상태를 한눈에 확인하세요.</p>
          </section>

          <main className="m-body">
            {error && <p role="alert" className="m-error">{error}</p>}

            <div className="m-storage-selector">
              <select
                className="m-select"
                value={selectedStorageId ?? ''}
                onChange={e => setSelectedStorageId(Number(e.target.value))}
              >
                {storages.map(storage => (
                  <option key={storage.storageId} value={storage.storageId}>
                    {storage.name}
                  </option>
                ))}
              </select>
              <button type="button" className="m-storage-info-link" onClick={() => navigate('/storage/info')}>
                저장고 목록 ›
              </button>
            </div>

            <div className="m-metrics-head">
              <span className="m-section-title">현재 저장 현황</span>
              <time dateTime={detail?.storeDate}>
                {detail ? formatMeasurementDate(detail) : '측정일 정보 없음'}
              </time>
            </div>
            <div className="m-metric-grid">
              {metrics.map(m => (
                <article className="m-metric-card" key={m.label}>
                  <div className="m-metric-top">
                    <h3>{m.label}</h3>
                    <img src={m.status === 'good' ? suitableIcon : cautionIcon} alt={m.status === 'good' ? '적합' : '주의'} />
                  </div>
                  <strong>{m.value}</strong>
                  <p>{m.description}</p>
                </article>
              ))}
            </div>

            <section className={`m-quality-panel ${hasWarning ? 'warning' : 'good'}`}>
              <div className="m-quality-head">
                <span className="m-section-title">저장 품질 상태</span>
                <span className={`m-quality-badge ${hasWarning ? 'warning' : 'good'}`}>
                  <img src={hasWarning ? cautionIcon : suitableIcon} alt="" />
                  {hasWarning ? '주의' : '적합'}
                </span>
              </div>
              {hasWarning ? (
                <p>에틸렌 농도가 주의 수준(0.3ppm)에 도달했습니다. 장기 저장 시 품질 저하 가능성이 있어 빠른 출하를 검토하세요.</p>
              ) : (
                <p>현재 저장 환경이 권장 기준을 충족하고 있습니다.</p>
              )}
            </section>

            <p className="m-cta-hint">*사진을 올리면 AI가 더 정확하게 분석해드려요</p>
            <div className="m-cta-buttons">
              <button
                className="m-secondary-btn"
                type="button"
                onClick={() => navigate('/storage/photo-upload', { state: { storageId: selectedStorageId, storageName: detail?.name } })}
              >
                사진 업로드하기
              </button>
              <button
                className="m-primary-btn m-ai-btn"
                type="button"
                onClick={() => navigate('/storage/ai', { state: { storageId: selectedStorageId } })}
              >
                AI 추천 받기
              </button>
            </div>
          </main>
        </>
      )}

      <MobileTabBar />
    </div>
  )
}

export default MobileStoragePage
