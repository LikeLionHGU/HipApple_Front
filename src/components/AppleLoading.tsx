import type { ReactNode } from 'react'
import redAppleIcon from '../assets/redapple.svg'
import greenAppleIcon from '../assets/greenapple.svg'
import './AppleLoading.css'

type AppleLoadingProps = {
  message: ReactNode
  compact?: boolean
}

// 전면 로딩 화면 — 빨강/초록 사과 5개가 순서대로 바운스되는 공용 로딩 컴포넌트
export default function AppleLoading({ message, compact }: AppleLoadingProps) {
  return (
    <div className={`apple-loading ${compact ? 'apple-loading--compact' : ''}`}>
      <div className="apple-loading-emojis" aria-hidden="true">
        <img src={redAppleIcon} alt="" />
        <img src={greenAppleIcon} alt="" />
        <img src={redAppleIcon} alt="" />
        <img src={greenAppleIcon} alt="" />
        <img src={redAppleIcon} alt="" />
      </div>
      <p className="apple-loading-message">{message}</p>
    </div>
  )
}
