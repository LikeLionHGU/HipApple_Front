import { Link, useLocation } from 'react-router-dom'
import './Header.css'

export default function Header() {
  const location = useLocation()

  const isAiPage = location.pathname === '/storage/ai'
  const isStoragePage = location.pathname.startsWith('/storage') && !isAiPage

  const navLinks = [
    { label: '저장고 현황', path: '/storage' },
    { label: '출하 AI', path: '/storage/ai' },
    { label: '시장 가격', path: '/market' },
    { label: '마이페이지', path: '/mypage' },
  ]

  return (
    <header className="market-navbar">
      <div className="market-logo">로고</div>
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
      </nav>
    </header>
  )
}
