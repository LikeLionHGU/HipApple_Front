import type { ReactNode } from 'react'
import './HeroBanner.css'

type HeroBannerProps = {
  title: ReactNode
  subtitle?: ReactNode
}

// 데스크톱 페이지 공통 상단 배너 — design-spacs/banner-css.md 스펙을 그대로 구현한 단일 소스.
// 페이지는 title/subtitle만 넘기면 되고, 레이아웃/색/여백은 이 컴포넌트가 전담해 픽셀 오차 없이 통일한다.
export default function HeroBanner({ title, subtitle }: HeroBannerProps) {
  return (
    <section className="hero-banner">
      <h1 className="hero-banner-title">{title}</h1>
      {subtitle && <p className="hero-banner-subtitle">{subtitle}</p>}
    </section>
  )
}
