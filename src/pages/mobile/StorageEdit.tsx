import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/MobileHeader'
import AcceptModal from '../../components/AcceptModal'
import { getStorage, updateStorage } from '../../api/storage'
import './app.css'
import './StorageCrud.css'

type EditForm = {
  name: string; variety: string; harvestDate: string; storageMethod: string
  brix: string; weight: string; condition: string; expectedAmount: string; expectedTime: string
}

const EMPTY_FORM: EditForm = {
  name: '', variety: '', harvestDate: '', storageMethod: '',
  brix: '', weight: '', condition: '', expectedAmount: '', expectedTime: '',
}

function MobileStorageEdit() {
  const navigate = useNavigate()
  const location = useLocation()
  const storageId = (location.state as { storageId?: number } | null)?.storageId
  const [form, setForm] = useState<EditForm>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (storageId == null) return
    getStorage(storageId)
      .then(detail => setForm({
        name: detail.storageName ?? detail.name ?? '',
        variety: detail.type ?? '',
        harvestDate: detail.storeDate ? detail.storeDate.split('T')[0] : '',
        storageMethod: detail.storageMethod ?? '',
        brix: detail.brix != null ? String(detail.brix) : '',
        weight: detail.hardness != null ? String(detail.hardness) : '',
        condition: detail.condition ?? '',
        expectedAmount: detail.amount != null ? String(detail.amount) : '',
        expectedTime: detail.preferredDate ?? '',
      }))
      .catch(err => setError(err instanceof Error ? err.message : '저장고 정보를 불러오지 못했습니다.'))
  }, [storageId])

  const update = (field: keyof EditForm, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const isValid = Boolean(form.name && form.variety && form.harvestDate && form.storageMethod && form.brix)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isValid || storageId == null) return

    try {
      await updateStorage(storageId, {
        name: form.name,
        appleType: form.variety,
        storeDate: `${form.harvestDate}T00:00:00`,
        storageMethod: form.storageMethod,
        brix: Math.round(Number(form.brix)),
        hardness: form.weight ? Math.round(Number(form.weight)) : undefined,
        condition: form.condition,
        amount: form.expectedAmount ? Math.round(Number(form.expectedAmount)) : undefined,
        preferredDate: form.expectedTime,
      })
      setIsModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정에 실패했습니다.')
    }
  }

  return (
    <div className="m-app">
      <MobileHeader back title="저장고 수정" onBack={() => navigate('/storage/info')} />

      {error && <p role="alert" className="m-error">{error}</p>}

      <form className="m-body m-crud-form" onSubmit={handleSubmit}>
        <div className="m-field">
          <label className="m-field-label" htmlFor="e-name"><span>*</span> 저장고</label>
          <input id="e-name" className="m-input" value={form.name} onChange={e => update('name', e.target.value)} />
        </div>
        <div className="m-field">
          <label className="m-field-label" htmlFor="e-variety"><span>*</span> 사과 품종</label>
          <select id="e-variety" className="m-select" value={form.variety} onChange={e => update('variety', e.target.value)}>
            <option value="" disabled>품종 선택</option>
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
            <option value="" disabled>저장 방식 선택</option>
            <option value="CA저장">CA저장</option>
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
            <option value="" disabled>외관 선택</option>
            <option value="특 (무결점)">특 (무결점)</option>
            <option value="상 (미세상처)">상 (미세상처)</option>
            <option value="보통 (상처/ 변색있음)">보통 (상처/ 변색있음)</option>
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
