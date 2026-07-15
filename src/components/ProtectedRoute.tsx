import { Navigate, Outlet } from 'react-router-dom'
import { isLoggedIn } from '../api/auth'

// 로그인하지 않은 사용자는 로그인 페이지로 돌려보냄
export default function ProtectedRoute() {
  return isLoggedIn() ? <Outlet /> : <Navigate to="/" replace />
}
