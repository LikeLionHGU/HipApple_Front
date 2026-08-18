// 백엔드 응답을 localStorage에 저장해두고 재방문 시 즉시 보여주기 위한 공용 캐시 유틸(SWR 패턴의 저장소 역할).
const PREFIX = 'hipapple:cache:'

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // 저장 공간 초과 등으로 캐싱에 실패해도 화면 동작에는 영향이 없으므로 조용히 무시한다
  }
}
