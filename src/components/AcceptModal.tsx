import './EditAcceptModal.css'

interface AcceptModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  subtitle: string
  confirmLabel?: string
}

function AcceptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  confirmLabel = '확인',
}: AcceptModalProps) {
  if (!isOpen) return null

  return (
    <div className="edit-modal-overlay" onClick={event => event.target === event.currentTarget && onClose()}>
      <div className="edit-modal-container" role="dialog" aria-modal="true" aria-labelledby="accept-modal-title">
        <button className="edit-modal-close" type="button" onClick={onClose} aria-label="닫기">×</button>
        <h2 id="accept-modal-title">{title}</h2>
        <p>{subtitle}</p>
        <div className="edit-modal-buttons">
          <button className="edit-modal-cancel" type="button" onClick={onClose}>취소</button>
          <button className="edit-modal-confirm" type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default AcceptModal
