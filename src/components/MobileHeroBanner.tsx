import type { ReactNode } from 'react'
import './MobileHeroBanner.css'

type MobileHeroBannerProps = {
  title: ReactNode
  subtitle?: ReactNode
}

// 모바일 페이지 공통 상단 배너 — HeroBanner(데스크톱)와 동일한 그라데이션/모서리 스펙을
// 좁은 화면에 맞게 적용한 단일 소스. 페이지는 title/subtitle만 넘긴다.
export default function MobileHeroBanner({ title, subtitle }: MobileHeroBannerProps) {
  return (
    <section className="mobile-hero-banner">
      <h1 className="mobile-hero-banner-title">{title}</h1>
      {subtitle && <p className="mobile-hero-banner-subtitle">{subtitle}</p>}
    </section>
  )
}
