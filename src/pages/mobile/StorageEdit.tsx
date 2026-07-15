import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/MobileHeader'
import AcceptModal from '../../components/AcceptModal'
import { STORAGE_LIST_KEY } from '../StorageInfo'
import './app.css'
import './StorageCrud.css'

type Storage = { name: string; date: string; description: string }
type EditForm = {
  name: string; variety: string; harvestDate: string; storageMethod: string
  brix: string; weight: string; condition: string; expectedAmount: string; expectedTime: string
}

function normalizeDate(date: string) {
  const [year, month, day] = date.replace(' ~', '').split('.')
  if (!year || !month || !day) return ''
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const getInitialForm = (storage?: Storage): EditForm => ({
  name: storage?.name ?? 'A동',
  variety: storage?.description.match(/^사과 (.+?) ·/)?.[1] ?? '홍로',
  harvestDate: storage ? normalizeDate(storage.date) : '2026-04-01',
  storageMethod: storage?.description.match(/· (.+?) ·/)?.[1] ?? 'CA 저장',
  brix: storage?.description.match(/당도 (.+)$/)?.[1] ?? '13',
  weight: '', condition: '특', expectedAmount: '', expectedTime: '추석 일주일 전',
})

function MobileStorageEdit() {
  const navigate = useNavigate()
  const location = useLocation()
  const storage = (location.state as { storage?: Storage } | null)?.storage
  const [form, setForm] = useState(() => getInitialForm(storage))
  const [isModalOpen, setIsModalOpen] = useState(false)

  const update = (field: keyof EditForm, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const isValid = Boolean(form.name && form.variety && form.harvestDate && form.storageMethod && form.brix)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isValid) return
    const saved = window.localStorage.getItem(STORAGE_LIST_KEY)
    const current: Storage[] = saved ? JSON.parse(saved) : []
    const updated = current.map(s =>
      s.name === storage?.name
        ? {
            name: form.name,
            date: `${form.harvestDate.replaceAll('-', '.')} ~`,
            description: `사과 ${form.variety} · ${form.storageMethod} · 당도 ${form.brix}`,
          }
        : s,
    )
    window.localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(updated))
    setIsModalOpen(true)
  }

  return (
    <div className="m-app">
      <MobileHeader back title="저장고 수정" onBack={() => navigate('/storage/info')} />

      <form className="m-body m-crud-form" onSubmit={handleSubmit}>
        <div className="m-field">
          <label className="m-field-label" htmlFor="e-name"><span>*</span> 저장고</label>
          <input id="e-name" className="m-input" value={form.name} onChange={e => update('name', e.target.value)} />
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="e-variety"><span>*</span> 사과 품종</label>
          <select id="e-variety" className="m-select" value={form.variety} onChange={e => update('variety', e.target.value)}>
            <option value="부사 (후지)">부사 (후지)</option>
            <option value="홍로">홍로</option>
            <option value="감홍">감홍</option>
            <option value="양광">양광</option>
            <option value="시나노스위트">시나노스위트</option>
          </select>
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="e-date"><span>*</span> 저장일</label>
          <input id="e-date" type="date" className="m-input" value={form.harvestDate} onChange={e => update('harvestDate', e.target.value)} />
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="e-method"><span>*</span> 저장 방식</label>
          <select id="e-method" className="m-select" value={form.storageMethod} onChange={e => update('storageMethod', e.target.value)}>
            <option value="CA 저장">CA 저장</option>
            <option value="일반 저온 저장">일반 저온 저장</option>
          </select>
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="e-brix"><span>*</span> 당도 (Brix)</label>
          <input id="e-brix" type="number" className="m-input" value={form.brix} onChange={e => update('brix', e.target.value)} />
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="e-weight">경도 (kg)</label>
          <input id="e-weight" type="number" className="m-input" value={form.weight} onChange={e => update('weight', e.target.value)} />
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="e-condition">외관 상태</label>
          <select id="e-condition" className="m-select" value={form.condition} onChange={e => update('condition', e.target.value)}>
            <option value="특">특</option>
            <option value="상">상</option>
            <option value="보통">보통</option>
          </select>
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="e-amount">예상 출하량 (톤)</label>
          <input id="e-amount" type="number" className="m-input" value={form.expectedAmount} onChange={e => update('expectedAmount', e.target.value)} />
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="e-time">희망 출하 시기</label>
          <input id="e-time" className="m-input" value={form.expectedTime} onChange={e => update('expectedTime', e.target.value)} />
        </div>

        <button className="m-primary-btn m-crud-save" type="submit" disabled={!isValid}>수정하기</button>
      </form>

      <AcceptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => navigate('/storage/info')}
        title="수정이 완료되었습니다"
        subtitle="저장고 정보가 성공적으로 수정되었습니다."
      />
    </div>
  )
}

export default MobileStorageEdit
