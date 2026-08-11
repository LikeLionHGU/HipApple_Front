import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MobileHeader from '../../components/MobileHeader'
import CameraCaptureModal from '../../components/CameraCaptureModal'
import { checkQuality, type QualityCheckResponse } from '../../api/storage'
import './app.css'
import './PhotoUploadPage.css'

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// 진단 결과 등급(우수/양호/불량)에 따른 뱃지 스타일 클래스
const GRADE_BADGE_CLASS: Record<string, string> = {
  우수: 'm-diagnosis-badge--good',
  양호: 'm-diagnosis-badge--fair',
  불량: 'm-diagnosis-badge--poor',
}

function MobilePhotoUploadPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { storageId?: number; storageName?: string } | null
  const storageId = state?.storageId
  const storageName = state?.storageName
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [result, setResult] = useState<QualityCheckResponse | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const goToShipmentAi = () => navigate('/storage/ai', { state: { storageId } })

  const handleSubmit = async () => {
    if (!file || storageId == null) {
      goToShipmentAi()
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const response = await checkQuality(storageId, file)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : '사진 분석에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="m-app">
      <MobileHeader back title="사진 업로드" onBack={() => navigate('/storage')} />

      <main className="m-body">
        {result ? (
          <div className="m-diagnosis-card">
            <div className="m-diagnosis-card-head">
              <div className="m-diagnosis-card-title">
                <span>진단 결과</span>
                <span className="m-diagnosis-card-storage">{storageName ? `${storageName} 저장고` : '저장고'}</span>
              </div>
              <button type="button" className="m-diagnosis-close" aria-label="닫기" onClick={goToShipmentAi}>×</button>
            </div>

            <span className={`m-diagnosis-badge ${GRADE_BADGE_CLASS[result.grade] ?? 'm-diagnosis-badge--fair'}`}>
              {result.grade}
            </span>

            {previewUrl && <img className="m-diagnosis-photo" src={previewUrl} alt="업로드한 사과 사진" />}

            <div className="m-diagnosis-reason">
              <h2>진단 근거</h2>
              <p>{result.shipmentComment}</p>
            </div>
          </div>
        ) : (
          <div className="m-photo-dropzone">
            <span className="m-photo-dropzone-icon" aria-hidden="true">⬆</span>
            <p className="m-photo-dropzone-title">사진을 이곳에 끌어다 놓아주세요</p>
            <p className="m-photo-dropzone-sub">또는 아래 버튼으로 파일을 선택하세요</p>
            <div className="m-photo-select-row">
              <button type="button" className="m-photo-select-button" onClick={() => inputRef.current?.click()}>
                {file ? '파일 다시 선택하기' : '파일 선택하기'}
              </button>
              <button type="button" className="m-photo-camera-button" onClick={() => setIsCameraOpen(true)}>
                촬영하기
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="m-photo-file-input"
              onChange={event => setFile(event.target.files?.[0] ?? null)}
            />

            {file && (
              <div className="m-photo-file-row">
                {previewUrl && <img className="m-photo-file-thumb" src={previewUrl} alt="" />}
                <div className="m-photo-file-info">
                  <strong>{file.name}</strong>
                  <span>{formatFileSize(file.size)}</span>
                </div>
                <button type="button" className="m-photo-file-remove" onClick={() => setFile(null)} aria-label="파일 제거">×</button>
              </div>
            )}
          </div>
        )}

        {error && <p role="alert" className="m-error">{error}</p>}

        {!result && (
          file ? (
            <button type="button" className="m-primary-btn m-photo-submit" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '분석 준비 중...' : '업로드하기'}
            </button>
          ) : (
            <p className="m-photo-skip-row">
              사진 없이 진행할게요{' '}
              <button type="button" className="m-photo-skip-link" onClick={goToShipmentAi}>건너뛰기</button>
            </p>
          )
        )}

        {result && (
          <button type="button" className="m-primary-btn m-photo-submit" onClick={goToShipmentAi}>
            AI 추천 받기
          </button>
        )}
      </main>

      {isCameraOpen && (
        <CameraCaptureModal
          onCapture={captured => setFile(captured)}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  )
}

export default MobilePhotoUploadPage
