import { useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'

const TABS = [
  {
    label: '저장고',
    path: '/storage',
    match: (p: string) => p.startsWith('/storage') && p !== '/storage/ai',
    icon: (
      <path d="M12 3v18M5 8l7-5 7 5M5 8v9l7 4 7-4V8" />
    ),
  },
  {
    label: '출하 AI',
    path: '/storage/ai',
    match: (p: string) => p === '/storage/ai',
    icon: (
      <path d="M12 2l2.4 5.6L20 9l-4.5 4 1.3 6L12 16l-4.8 3 1.3-6L4 9l5.6-1.4L12 2z" />
    ),
  },
  {
    label: '시장 가격',
    path: '/market',
    match: (p: string) => p === '/market',
    icon: (
      <path d="M4 19V5M4 19h16M7 15l4-4 3 3 5-6" />
    ),
  },
]

// 모바일 하단 탭바 (앱 주요 화면 공용)
export default function MobileTabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return
    logout()
    navigate('/', { replace: true })
  }

  return (
    <nav className="m-tabbar">
      {TABS.map(tab => {
        const active = tab.match(location.pathname)
        return (
          <button
            key={tab.path}
            type="button"
            className={`m-tab ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {tab.icon}
            </svg>
            <span>{tab.label}</span>
          </button>
        )
      })}
      <button type="button" className="m-tab" onClick={handleLogout}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        <span>로그아웃</span>
      </button>
    </nav>
  )
}
