import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { STORAGE_LIST_KEY } from './StorageInfo'
import './StorageEdit.css'

type Storage = {
  name: string
  date: string
  description: string
}

type EditForm = {
  name: string
  variety: string
  harvestDate: string
  storageMethod: string
  brix: string
  weight: string
  condition: string
  expectedAmount: string
  expectedTime: string
}

const getInitialForm = (storage?: Storage): EditForm => ({
  name: storage?.name ?? 'A동',
  variety: storage?.description.match(/^사과 (.+?) ·/)?.[1] ?? '홍로',
  harvestDate: storage?.date.replaceAll('.', '-').replace(' ~', '') ?? '2026-04-01',
  storageMethod: storage?.description.match(/· (.+?) ·/)?.[1] ?? 'CA 저장',
  brix: storage?.description.match(/당도 (.+)$/)?.[1] ?? '13',
  weight: '',
  condition: '특',
  expectedAmount: '',
  expectedTime: '추석 일주일 전',
})

function StorageEdit() {
  const navigate = useNavigate()
  const location = useLocation()
  const storage = (location.state as { storage?: Storage } | null)?.storage
  const [form, setForm] = useState(() => getInitialForm(storage))

  const updateField = (field: keyof EditForm, value: string) => {
    setForm(currentForm => ({ ...currentForm, [field]: value }))
  }

  const isFormValid = Boolean(
    form.name && form.variety && form.harvestDate && form.storageMethod && form.brix,
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isFormValid) return

    const savedStorages = window.localStorage.getItem(STORAGE_LIST_KEY)
    const currentStorages: Storage[] = savedStorages ? JSON.parse(savedStorages) : []
    const updatedStorages = currentStorages.map(currentStorage => (
      currentStorage.name === storage?.name
        ? {
            name: form.name,
            date: `${form.harvestDate.replaceAll('-', '.')} ~`,
            description: `사과 ${form.variety} · ${form.storageMethod} · 당도 ${form.brix}`,
          }
        : currentStorage
    ))

    window.localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(updatedStorages))
    navigate('/StorageInfo')
  }

  return (
    <div className="storage-edit-page">
      <Header />
      <main className="storage-edit-main">
        <button className="storage-edit-back-button" type="button" onClick={() => navigate('/StorageInfo')}>
          <span aria-hidden="true">‹</span> 저장고 정보 수정하기
        </button>

        <form className="storage-edit-form" onSubmit={handleSubmit}>
          <section className="edit-panel edit-basic-panel">
            <EditField label="저장고" required id="edit-name">
              <input id="edit-name" value={form.name} onChange={event => updateField('name', event.target.value)} />
            </EditField>
            <EditField label="사과 품종" required id="edit-variety">
              <select id="edit-variety" value={form.variety} onChange={event => updateField('variety', event.target.value)}>
                <option value="부사 (후지)">부사 (후지)</option><option value="홍로">홍로</option><option value="감홍">감홍</option><option value="양광">양광</option><option value="시나노스위트">시나노스위트</option>
              </select>
            </EditField>
            <EditField label="저장일" required id="edit-date">
              <input id="edit-date" type="date" value={form.harvestDate} onChange={event => updateField('harvestDate', event.target.value)} />
            </EditField>
            <EditField label="저장 방식" required id="edit-method">
              <select id="edit-method" value={form.storageMethod} onChange={event => updateField('storageMethod', event.target.value)}><option value="CA 저장">CA 저장</option><option value="일반 저온 저장">일반 저온 저장</option></select>
            </EditField>
          </section>

          <section className="edit-panel edit-condition-panel">
            <EditField label="당도 (Brix)" required id="edit-brix">
              <input id="edit-brix" type="number" value={form.brix} onChange={event => updateField('brix', event.target.value)} />
            </EditField>
            <EditField label="경도 (kg)" id="edit-weight">
              <input id="edit-weight" type="number" value={form.weight} onChange={event => updateField('weight', event.target.value)} />
            </EditField>
            <EditField label="외관 상태" id="edit-condition">
              <select id="edit-condition" value={form.condition} onChange={event => updateField('condition', event.target.value)}><option value="특">특</option><option value="상">상</option><option value="보통">보통</option></select>
            </EditField>
          </section>

          <section className="edit-panel edit-shipment-panel">
            <EditField label="예상 출하량 (톤)" id="edit-amount"><input id="edit-amount" type="number" value={form.expectedAmount} onChange={event => updateField('expectedAmount', event.target.value)} /></EditField>
            <EditField label="희망 출하 시기" id="edit-time"><input id="edit-time" value={form.expectedTime} onChange={event => updateField('expectedTime', event.target.value)} /></EditField>
          </section>

          <button className="storage-update-button" type="submit" disabled={!isFormValid}>수정하기</button>
        </form>
      </main>
    </div>
  )
}

function EditField({ label, required = false, id, children }: { label: string; required?: boolean; id: string; children: React.ReactNode }) {
  return <div className="edit-field"><label htmlFor={id}>{required && <span>*</span>} {label}</label>{children}</div>
}

export default StorageEdit
