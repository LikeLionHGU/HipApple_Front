import { useNavigate } from 'react-router-dom'
import farmsignLogo from '../assets/farmsign-logo.svg'

type MobileHeaderProps = {
  back?: boolean
  title?: string
  onBack?: () => void
}

// 모바일 상단바. back이면 뒤로가기+제목, 아니면 로고.
export default function MobileHeader({ back, title, onBack }: MobileHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="m-topbar">
      {back ? (
        <button
          className="m-topbar-back"
          type="button"
          onClick={onBack ?? (() => navigate(-1))}
          aria-label="뒤로"
        >
          ‹
        </button>
      ) : (
        <img
          className="m-topbar-logo"
          src={farmsignLogo}
          alt="팜사인 로고"
          onClick={() => navigate('/storage')}
        />
      )}
      {title && <span className="m-topbar-title">{title}</span>}
    </header>
  )
}
