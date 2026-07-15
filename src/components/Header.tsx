import { Link, useLocation, useNavigate } from 'react-router-dom'
import farmsignLogo from '../assets/farmsign-logo.svg'
import { logout } from '../api/auth'
import './Header.css'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()

  const isAiPage = location.pathname === '/storage/ai'
  const isStoragePage = location.pathname.startsWith('/storage') && !isAiPage

  const navLinks = [
    { label: '저장고 현황', path: '/storage' },
    { label: '출하 AI', path: '/storage/ai' },
    { label: '시장 가격', path: '/market' },
  ]

  const handleLogout = () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="market-navbar">
      <img className="market-logo" src={farmsignLogo} alt="팜사인 로고" />
      <nav className="market-nav">
        {navLinks.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`nav-link ${
              link.path === '/storage' ? (isStoragePage ? 'active' : '')
                : link.path === '/storage/ai' ? (isAiPage ? 'active' : '')
                : location.pathname === link.path ? 'active' : ''
            }`}
          >
            {link.label}
          </Link>
        ))}
        <button type="button" className="nav-link nav-link-logout" onClick={handleLogout}>
          로그아웃
        </button>
      </nav>
    </header>
  )
}
