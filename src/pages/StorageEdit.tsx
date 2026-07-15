import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getStorage, updateStorage } from '../api/storage'
import AcceptModal from '../components/AcceptModal'
import './StorageEdit.css'

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

const EMPTY_FORM: EditForm = {
  name: '',
  variety: '',
  harvestDate: '',
  storageMethod: '',
  brix: '',
  weight: '',
  condition: '',
  expectedAmount: '',
  expectedTime: '',
}

function StorageEdit() {
  const navigate = useNavigate()
  const location = useLocation()
  const storageId = (location.state as { storageId?: number } | null)?.storageId
  const [form, setForm] = useState<EditForm>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 세부 저장고 정보를 조회해 폼을 채운다 (StorageDetail 기준)
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

  const updateField = (field: keyof EditForm, value: string) => {
    setForm(currentForm => ({ ...currentForm, [field]: value }))
  }

  // 백엔드 필수값: name, appleType, storeDate, storageMethod, condition, preferredDate
  const isFormValid = Boolean(
    form.name && form.variety && form.harvestDate && form.storageMethod && form.brix &&
    form.condition && form.expectedTime,
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isFormValid || storageId == null) return

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
    <div className="storage-edit-page">
      <Header />
      <main className="storage-edit-main">
        <button className="storage-edit-back-button" type="button" onClick={() => navigate('/storage/info')}>
          <span aria-hidden="true">‹</span> 저장고 정보 수정하기
        </button>

        {error && <p role="alert" className="storage-edit-error">{error}</p>}

        <form className="storage-edit-form" onSubmit={handleSubmit}>
          <section className="edit-panel edit-basic-panel">
            <EditField label="저장고" required id="edit-name">
              <input id="edit-name" value={form.name} onChange={event => updateField('name', event.target.value)} />
            </EditField>
            <EditField label="사과 품종" required id="edit-variety">
              <select id="edit-variety" value={form.variety} onChange={event => updateField('variety', event.target.value)}>
                <option value="" disabled>품종 선택</option>
                <option value="부사 (후지)">부사 (후지)</option><option value="홍로">홍로</option><option value="감홍">감홍</option><option value="양광">양광</option><option value="시나노스위트">시나노스위트</option>
              </select>
            </EditField>
            <EditField label="저장일" required id="edit-date">
              <input id="edit-date" type="date" value={form.harvestDate} onChange={event => updateField('harvestDate', event.target.value)} />
            </EditField>
            <EditField label="저장 방식" required id="edit-method">
              <select id="edit-method" value={form.storageMethod} onChange={event => updateField('storageMethod', event.target.value)}><option value="" disabled>저장 방식 선택</option><option value="CA저장">CA저장</option><option value="일반 저온 저장">일반 저온 저장</option></select>
            </EditField>
          </section>

          <section className="edit-panel edit-condition-panel">
            <EditField label="당도 (Brix)" required id="edit-brix">
              <input id="edit-brix" type="number" value={form.brix} onChange={event => updateField('brix', event.target.value)} />
            </EditField>
            <EditField label="경도 (kg)" id="edit-weight">
              <input id="edit-weight" type="number" value={form.weight} onChange={event => updateField('weight', event.target.value)} />
            </EditField>
            <EditField label="외관 상태" required id="edit-condition">
              <select id="edit-condition" value={form.condition} onChange={event => updateField('condition', event.target.value)}><option value="" disabled>외관 선택</option><option value="특 (무결점)">특 (무결점)</option><option value="상 (미세상처)">상 (미세상처)</option><option value="보통 (상처/ 변색있음)">보통 (상처/ 변색있음)</option></select>
            </EditField>
          </section>

          <section className="edit-panel edit-shipment-panel">
            <EditField label="예상 출하량 (톤)" id="edit-amount"><input id="edit-amount" type="number" value={form.expectedAmount} onChange={event => updateField('expectedAmount', event.target.value)} /></EditField>
            <EditField label="희망 출하 시기" required id="edit-time"><input id="edit-time" value={form.expectedTime} onChange={event => updateField('expectedTime', event.target.value)} /></EditField>
          </section>

          <button className="storage-update-button" type="submit" disabled={!isFormValid}>수정하기</button>
        </form>
      </main>
      <Footer />
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

function EditField({ label, required = false, id, children }: { label: string; required?: boolean; id: string; children: React.ReactNode }) {
  return <div className="edit-field"><label htmlFor={id}>{required && <span>*</span>} {label}</label>{children}</div>
}

export default StorageEdit
