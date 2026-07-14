import './EditAcceptModal.css'

interface EditAcceptModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

function EditAcceptModal({ isOpen, onClose, onConfirm }: EditAcceptModalProps) {
  if (!isOpen) return null

  return (
    <div className="edit-modal-overlay" onClick={event => event.target === event.currentTarget && onClose()}>
      <div className="edit-modal-container" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
        <button className="edit-modal-close" type="button" onClick={onClose} aria-label="닫기">×</button>
        <h2 id="edit-modal-title">수정이 완료되었습니다</h2>
        <p>저장고 정보가 성공적으로 수정되었습니다.</p>
        <div className="edit-modal-buttons">
          <button className="edit-modal-cancel" type="button" onClick={onClose}>취소</button>
          <button className="edit-modal-confirm" type="button" onClick={onConfirm}>확인</button>
        </div>
      </div>
    </div>
  )
}

export default EditAcceptModal
