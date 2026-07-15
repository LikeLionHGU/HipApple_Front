import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/MobileHeader'
import { STORAGE_LIST_KEY } from '../StorageInfo'
import './app.css'
import './StorageCrud.css'

type Storage = { name: string; date: string; description: string }

const INITIAL_STORAGES: Storage[] = [
  { name: 'A동', date: '2026.7.1 ~', description: '사과 부사 · CA 저장 · 당도 12' },
  { name: 'B동', date: '2026.7.4 ~', description: '사과 홍로 · CA 저장 · 당도 15' },
]

const getStoredStorages = (): Storage[] => {
  const saved = window.localStorage.getItem(STORAGE_LIST_KEY)
  if (!saved) return INITIAL_STORAGES
  try {
    return JSON.parse(saved) as Storage[]
  } catch {
    return INITIAL_STORAGES
  }
}

function MobileStorageInfo() {
  const navigate = useNavigate()
  const [storages] = useState<Storage[]>(getStoredStorages)

  return (
    <div className="m-app">
      <MobileHeader back title="저장고 정보" onBack={() => navigate('/storage')} />

      <main className="m-body">
        <div className="m-storage-list">
          {storages.map(storage => (
            <article className="m-storage-card" key={storage.name}>
              <div className="m-storage-card-head">
                <h2>{storage.name}</h2>
                <time>{storage.date}</time>
              </div>
              <p>{storage.description}</p>
              <button
                className="m-storage-edit-btn"
                type="button"
                onClick={() => navigate('/storage/edit', { state: { storage } })}
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
