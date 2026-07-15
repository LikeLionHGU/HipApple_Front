import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AcceptModal from '../components/AcceptModal'
import { createStorage } from '../api/storage'
import './StorageAdd.css'

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
  name: '',
  variety: '',
  harvestDate: '',
  storageMethod: '',
  brix: '13',
  weight: '',
  condition: '',
  expectedAmount: '',
  expectedTime: '',
}

function StorageAdd() {
  const navigate = useNavigate()
  const [form, setForm] = useState<StorageForm>(INITIAL_FORM)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const updateField = (field: keyof StorageForm, value: string) => {
    setForm(currentForm => ({ ...currentForm, [field]: value }))
  }

  // 저장 버튼 활성화 조건은 화면에서 *가 표시된 항목만 사용한다.
  const requiredFields = [
    form.name,
    form.variety,
    form.harvestDate,
    form.storageMethod,
    form.brix,
  ]
  const isFormValid = requiredFields.every(value => value.trim().length > 0)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isFormValid) return

    // brix/hardness/amount는 서버 스키마상 정수(int32)이므로 반올림해 전송
    const hardness = Number(form.weight)
    const amount = Number(form.expectedAmount)

    await createStorage({
      name: form.name,
      appleType: form.variety,
      storeDate: `${form.harvestDate}T00:00:00`,
      storageMethod: form.storageMethod,
      brix: Math.round(Number(form.brix)),
      // 현재 백엔드가 hardness 누락 시 0으로 처리하고 0을 거부하므로 기본값 1을 전송한다.
      hardness: hardness > 0 ? Math.round(hardness) : 1,
      condition: form.condition || '보통',
      amount: amount > 0 ? Math.round(amount) : undefined,
      preferredDate: form.expectedTime || '미정',
    })
    setIsModalOpen(true)
  }

  return (
    <div className="storage-add-page">
      <Header />
      <main className="storage-add-main">
        <button
          className="storage-add-back-button"
          type="button"
          onClick={() => navigate('/storage/info')}
        >
          <span aria-hidden="true">‹</span> 저장고 정보 추가하기
        </button>

        <form className="storage-add-form" onSubmit={handleSubmit}>
          <section className="storage-form-panel storage-basic-panel">
            <div className="form-field">
              <label htmlFor="storage-name"><span>*</span> 저장고</label>
              <input id="storage-name" placeholder="예시: A동" value={form.name} onChange={event => updateField('name', event.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="storage-variety"><span>*</span> 사과 품종</label>
              <select id="storage-variety" value={form.variety} onChange={event => updateField('variety', event.target.value)}>
                <option value="" disabled>품종 선택</option>
                <option value="부사 (후지)">부사 (후지)</option>
                <option value="홍로">홍로</option>
                <option value="감홍">감홍</option>
                <option value="양광">양광</option>
                <option value="시나노스위트">시나노스위트</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="harvest-date"><span>*</span> 저장일</label>
              <input id="harvest-date" type="date" value={form.harvestDate} onChange={event => updateField('harvestDate', event.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="storage-method"><span>*</span> 저장 방식</label>
              <select id="storage-method" value={form.storageMethod} onChange={event => updateField('storageMethod', event.target.value)}>
                <option value="" disabled>저장 방식 선택</option>
                <option value="CA저장">CA저장</option>
                <option value="일반 저온 저장">일반 저온 저장</option>
              </select>
            </div>
          </section>

          <section className="storage-form-panel storage-condition-panel">
            <div className="form-field">
              <label htmlFor="brix"><span>*</span> 당도 (Brix)</label>
              <input id="brix" type="number" min="0" step="0.1" value={form.brix} onChange={event => updateField('brix', event.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="weight">경도 (kg)</label>
              <input id="weight" type="number" min="0" step="0.1" value={form.weight} onChange={event => updateField('weight', event.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="condition">외관 상태</label>
              <select id="condition" value={form.condition} onChange={event => updateField('condition', event.target.value)}>
                <option value="" disabled>외관 선택</option>
                <option value="특 (무결점)">특 (무결점)</option>
                <option value="상 (미세상처)">상 (미세상처)</option>
                <option value="보통 (상처/ 변색있음)">보통 (상처/ 변색있음)</option>
              </select>
            </div>
          </section>

          <section className="storage-form-panel storage-shipment-panel">
            <div className="form-field">
              <label htmlFor="expected-amount">예상 출하량 (톤)</label>
              <input id="expected-amount" type="number" min="0" step="0.1" value={form.expectedAmount} onChange={event => updateField('expectedAmount', event.target.value)} />
            </div>
            <div className="form-field shipment-time-field">
              <label htmlFor="expected-time">희망 출하 시기</label>
              <input id="expected-time" placeholder="예시 : 12월 중순, 설 명절 전" value={form.expectedTime} onChange={event => updateField('expectedTime', event.target.value)} />
            </div>
          </section>

          <button className="storage-save-button" type="submit" disabled={!isFormValid}>
            저장하기
          </button>
        </form>
      </main>
      <Footer />
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

export default StorageAdd
