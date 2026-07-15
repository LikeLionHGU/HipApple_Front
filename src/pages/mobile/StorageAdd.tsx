import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/MobileHeader'
import AcceptModal from '../../components/AcceptModal'
import { STORAGE_LIST_KEY } from '../StorageInfo'
import './app.css'
import './StorageCrud.css'

type StorageForm = {
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

const INITIAL_FORM: StorageForm = {
  name: 'A동', variety: '', harvestDate: '', storageMethod: '', brix: '13',
  weight: '', condition: '', expectedAmount: '', expectedTime: '',
}

function MobileStorageAdd() {
  const navigate = useNavigate()
  const [form, setForm] = useState<StorageForm>(INITIAL_FORM)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const update = (field: keyof StorageForm, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const isValid = Boolean(form.name && form.variety && form.harvestDate && form.storageMethod && form.brix)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isValid) return
    const saved = window.localStorage.getItem(STORAGE_LIST_KEY)
    const current = saved ? JSON.parse(saved) : [
      { name: 'A동', date: '2026.7.1 ~', description: '사과 부사 · CA 저장 · 당도 12' },
      { name: 'B동', date: '2026.7.4 ~', description: '사과 홍로 · CA 저장 · 당도 15' },
    ]
    const newStorage = {
      name: form.name,
      date: `${form.harvestDate.replaceAll('-', '.')} ~`,
      description: `사과 ${form.variety} · ${form.storageMethod} · 당도 ${form.brix}`,
    }
    window.localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify([...current, newStorage]))
    setIsModalOpen(true)
  }

  return (
    <div className="m-app">
      <MobileHeader back title="저장고 추가" onBack={() => navigate('/storage/info')} />

      <form className="m-body m-crud-form" onSubmit={handleSubmit}>
        <div className="m-field">
          <label className="m-field-label" htmlFor="name"><span>*</span> 저장고</label>
          <input id="name" className="m-input" value={form.name} onChange={e => update('name', e.target.value)} />
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="variety"><span>*</span> 사과 품종</label>
          <select id="variety" className="m-select" value={form.variety} onChange={e => update('variety', e.target.value)}>
            <option value="" disabled>품종 선택</option>
            <option value="부사 (후지)">부사 (후지)</option>
            <option value="홍로">홍로</option>
            <option value="감홍">감홍</option>
            <option value="양광">양광</option>
            <option value="시나노스위트">시나노스위트</option>
          </select>
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="date"><span>*</span> 저장일</label>
          <input id="date" type="date" className="m-input" value={form.harvestDate} onChange={e => update('harvestDate', e.target.value)} />
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="method"><span>*</span> 저장 방식</label>
          <select id="method" className="m-select" value={form.storageMethod} onChange={e => update('storageMethod', e.target.value)}>
            <option value="" disabled>저장 방식 선택</option>
            <option value="CA저장">CA저장</option>
            <option value="일반 저온 저장">일반 저온 저장</option>
          </select>
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="brix"><span>*</span> 당도 (Brix)</label>
          <input id="brix" type="number" min="0" step="0.1" className="m-input" value={form.brix} onChange={e => update('brix', e.target.value)} />
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="weight">경도 (kg)</label>
          <input id="weight" type="number" min="0" step="0.1" className="m-input" value={form.weight} onChange={e => update('weight', e.target.value)} />
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="condition">외관 상태</label>
          <select id="condition" className="m-select" value={form.condition} onChange={e => update('condition', e.target.value)}>
            <option value="" disabled>외관 선택</option>
            <option value="특 (무결점)">특 (무결점)</option>
            <option value="상 (미세상처)">상 (미세상처)</option>
            <option value="보통 (상처/ 변색있음)">보통 (상처/ 변색있음)</option>
          </select>
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="amount">예상 출하량 (톤)</label>
          <input id="amount" type="number" min="0" step="0.1" className="m-input" value={form.expectedAmount} onChange={e => update('expectedAmount', e.target.value)} />
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="time">희망 출하 시기</label>
          <input id="time" className="m-input" placeholder="예: 12월 중순, 설 명절 전" value={form.expectedTime} onChange={e => update('expectedTime', e.target.value)} />
        </div>

        <button className="m-primary-btn m-crud-save" type="submit" disabled={!isValid}>저장하기</button>
      </form>

      <AcceptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => navigate('/storage/info')}
        title="저장이 완료되었습니다"
        subtitle="새로운 저장고 정보가 추가되었습니다."
      />
    </div>
  )
}

export default MobileStorageAdd
