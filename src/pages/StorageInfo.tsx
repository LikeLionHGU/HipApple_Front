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

function StorageInfo() {
  const navigate = useNavigate()
  const [storages, setStorages] = useState(INITIAL_STORAGES)

  const handleEdit = (storage: Storage) => {
    const description = window.prompt('저장고 정보를 수정하세요.', storage.description)
    if (description === null || !description.trim()) return

    setStorages(currentStorages => currentStorages.map(currentStorage => (
      currentStorage.name === storage.name
        ? { ...currentStorage, description: description.trim() }
        : currentStorage
    )))
  }

  const handleAdd = () => {
    const nextName = String.fromCharCode(65 + storages.length) + '동'
    setStorages(currentStorages => [
      ...currentStorages,
      { name: nextName, date: '2026.7.15 ~', description: '저장고 정보를 입력해주세요' },
    ])
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
