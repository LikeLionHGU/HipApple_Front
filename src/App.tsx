import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import SignupInfoPage from './pages/SignupInfoPage'
import SignupCompletePage from './pages/SignupCompletePage'
import MarketPricePage from './pages/MarketPricePage'
import StoragePage from './pages/StoragePage'
import StorageInfo from './pages/StorageInfo'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/info" element={<SignupInfoPage />} />
        <Route path="/signup/step3" element={<SignupCompletePage />} />
        <Route path="/market" element={<MarketPricePage />} />
        <Route path="/storage" element={<StoragePage />} />
        <Route path="/StorageInfo" element={<StorageInfo />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
