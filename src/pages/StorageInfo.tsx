import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import './StorageInfo.css'

type Storage = {
  name: string
  date: string
  description: string
}

const INITIAL_STORAGES: Storage[] = [
  { name: 'A동', date: '2026.7.1 ~', description: '사과 부사 · CA 저장 · 당도 12' },
  { name: 'B동', date: '2026.7.4 ~', description: '사과 홍로 · CA 저장 · 당도 15' },
]

export const STORAGE_LIST_KEY = 'hipapple-storage-list'

const getStoredStorages = (): Storage[] => {
  const savedStorages = window.localStorage.getItem(STORAGE_LIST_KEY)
  if (!savedStorages) return INITIAL_STORAGES

  try {
    return JSON.parse(savedStorages) as Storage[]
  } catch {
    return INITIAL_STORAGES
  }
}

function StorageInfo() {
  const navigate = useNavigate()
  const [storages] = useState<Storage[]>(getStoredStorages)

  const handleEdit = (storage: Storage) => {
    navigate('/storage/edit', { state: { storage } })
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

        <section className="storage-list" aria-label="저장고 목록">
          {storages.map(storage => (
            <article className="storage-card" key={storage.name}>
              <div className="storage-card-heading">
                <h1>{storage.name}</h1>
                <time>{storage.date}</time>
              </div>
              <p>{storage.description}</p>
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
    </div>
  )
}

export default StorageInfo
