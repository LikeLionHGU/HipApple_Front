import type { ComponentType } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'

// 데스크톱/모바일 컴포넌트를 받아, 기기에 맞는 쪽을 렌더하는 컴포넌트를 생성.
// 라우트에서 넘긴 props는 그대로 전달된다.
export function responsive<P extends object>(
  Desktop: ComponentType<P>,
  Mobile: ComponentType<P>,
) {
  return function ResponsivePage(props: P) {
    const isMobile = useIsMobile()
    const Chosen = isMobile ? Mobile : Desktop
    return <Chosen {...props} />
  }
}
