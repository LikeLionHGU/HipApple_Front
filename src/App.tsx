import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { responsive } from './components/responsive'
import LandingPage from './pages/LandingPage'
import MobileLandingPage from './pages/mobile/LandingPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import LoginPage from './pages/LoginPage'
import MobileLoginPage from './pages/mobile/LoginPage'
import SignupInfoPage from './pages/SignupInfoPage'
import MobileSignupInfoPage from './pages/mobile/SignupInfoPage'
import SignupCompletePage from './pages/SignupCompletePage'
import MobileSignupCompletePage from './pages/mobile/SignupCompletePage'
import MarketPricePage from './pages/MarketPricePage'
import MobileMarketPricePage from './pages/mobile/MarketPricePage'
import StoragePage from './pages/StoragePage'
import MobileStoragePage from './pages/mobile/StoragePage'
import StorageInfo from './pages/StorageInfo'
import MobileStorageInfo from './pages/mobile/StorageInfo'
import StorageAdd from './pages/StorageAdd'
import MobileStorageAdd from './pages/mobile/StorageAdd'
import StorageEdit from './pages/StorageEdit'
import MobileStorageEdit from './pages/mobile/StorageEdit'

const Landing = responsive(LandingPage, MobileLandingPage)
const Login = responsive(LoginPage, MobileLoginPage)
const SignupInfo = responsive(SignupInfoPage, MobileSignupInfoPage)
const SignupComplete = responsive(SignupCompletePage, MobileSignupCompletePage)
const Market = responsive(MarketPricePage, MobileMarketPricePage)
const Storage = responsive(StoragePage, MobileStoragePage)
const StorageInfoPage = responsive(StorageInfo, MobileStorageInfo)
const StorageAddPage = responsive(StorageAdd, MobileStorageAdd)
const StorageEditPage = responsive(StorageEdit, MobileStorageEdit)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        {/* 로그인/회원가입 통합: 예전 링크 호환용 리다이렉트 */}
        <Route path="/signup" element={<Navigate to="/login" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/signup/info" element={<SignupInfo />} />
          <Route path="/signup/step3" element={<SignupComplete />} />
          <Route path="/market" element={<Market />} />
          <Route path="/storage" element={<Storage />} />
          <Route path="/storage/ai" element={<Storage showAiRecommendations />} />
          <Route path="/storage/info" element={<StorageInfoPage />} />
          <Route path="/storage/add" element={<StorageAddPage />} />
          <Route path="/storage/edit" element={<StorageEditPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
