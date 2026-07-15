import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getStorages, type StorageSummary } from '../api/storage'
import './StorageInfo.css'

type Storage = StorageSummary

function StorageInfo() {
  const navigate = useNavigate()
  const [storages, setStorages] = useState<Storage[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    getStorages().then(setStorages).catch(error => setError(error instanceof Error ? error.message : '저장고 목록을 불러오지 못했습니다.'))
  }, [])

  const handleEdit = (storage: Storage) => {
    navigate('/storage/edit', { state: { storageId: storage.storageId, storage } })
  }

  const handleAdd = () => {
    navigate('/storage/add')
  }

  return (
    <div className="storage-info-page">
      <Header />
      <main className="storage-info-main">
        <button
          className="storage-info-back-button"
          type="button"
          onClick={() => navigate('/storage')}
        >
          <span aria-hidden="true">‹</span> 저장고 정보
        </button>

        {error && <p role="alert">{error}</p>}
        <section className="storage-list" aria-label="저장고 목록">
          {storages.map(storage => (
            <article className="storage-card" key={storage.storageId}>
              <div className="storage-card-heading">
                <h1>{storage.storageName ?? storage.name ?? `저장고 ${storage.storageId}`}</h1>
                <time>{String(storage.startDate).replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')} ~</time>
              </div>
              <p>사과 {storage.type} · {storage.storageMethod} · 당도 {storage.brix}</p>
              <button className="edit-storage-button" type="button" onClick={() => handleEdit(storage)}>
                수정하기
              </button>
            </article>
          ))}

          <button className="add-storage-button" type="button" onClick={handleAdd}>
            추가하기
          </button>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default StorageInfo
