import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/MobileHeader'
import { getStorages, type StorageSummary } from '../../api/storage'
import './app.css'
import './StorageCrud.css'

function MobileStorageInfo() {
  const navigate = useNavigate()
  const [storages, setStorages] = useState<StorageSummary[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    getStorages()
      .then(setStorages)
      .catch(err => setError(err instanceof Error ? err.message : '저장고 목록을 불러오지 못했습니다.'))
  }, [])

  return (
    <div className="m-app">
      <MobileHeader back title="저장고 목록" onBack={() => navigate('/storage')} />

      <main className="m-body">
        {error && <p role="alert" className="m-error">{error}</p>}
        <div className="m-storage-list">
          {storages.map(storage => (
            <article className="m-storage-card" key={storage.storageId}>
              <div className="m-storage-card-head">
                <h2>{storage.name}</h2>
                <time>{String(storage.startDate).replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')} ~</time>
              </div>
              <p>사과 {storage.type} · {storage.storageMethod} · 당도 {storage.brix}</p>
              <button
                className="m-storage-edit-btn"
                type="button"
                onClick={() => navigate('/storage/edit', { state: { storageId: storage.storageId, storage } })}
              >
                수정하기
              </button>
            </article>
          ))}

          <button className="m-storage-add-btn" type="button" onClick={() => navigate('/storage/add')}>
            + 추가하기
          </button>
        </div>
      </main>
    </div>
  )
}

export default MobileStorageInfo
