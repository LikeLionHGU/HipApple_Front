import { useEffect, useRef } from 'react'

// 전면 로딩 화면을 최대 maxMs 동안만 유지한다.
// 그 이후엔 백엔드 응답이 늦어도 레이아웃을 먼저 보여주고, 실제 데이터는 도착하는 대로
// 화면에 자연스럽게 스며들 듯 교체된다 (Stale-While-Revalidate의 "즉시 노출" 부분).
export function useLoadingCap(isLoading: boolean, onTimeout: () => void, maxMs = 2000) {
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    if (!isLoading) return
    const timer = setTimeout(() => onTimeoutRef.current(), maxMs)
    return () => clearTimeout(timer)
  }, [isLoading, maxMs])
}
