import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import SignupInfoPage from './pages/SignupInfoPage'
import SignupCompletePage from './pages/SignupCompletePage'
import MarketPricePage from './pages/MarketPricePage'
import StoragePage from './pages/StoragePage'
import StorageInfo from './pages/StorageInfo'
import StorageAdd from './pages/StorageAdd'
import StorageEdit from './pages/StorageEdit'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/signup/info" element={<SignupInfoPage />} />
          <Route path="/signup/step3" element={<SignupCompletePage />} />
          <Route path="/market" element={<MarketPricePage />} />
          <Route path="/storage" element={<StoragePage />} />
          <Route path="/storage/ai" element={<StoragePage showAiRecommendations />} />
          <Route path="/storage/info" element={<StorageInfo />} />
          <Route path="/storage/add" element={<StorageAdd />} />
          <Route path="/storage/edit" element={<StorageEdit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
