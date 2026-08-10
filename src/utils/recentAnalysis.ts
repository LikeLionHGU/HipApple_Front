const STORAGE_KEY = 'farmsign:lastAnalyzedStorageId'

// StoragePage에서 'AI 추천 받기'로 분석한 저장고 ID를 저장/조회한다.
// 헤더의 '출하 AI' 메뉴로 바로 들어왔을 때(라우터 state 없음) 최근 분석 결과를 이어서 보여주기 위함.
export function getLastAnalyzedStorageId(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

export function setLastAnalyzedStorageId(storageId: number) {
  localStorage.setItem(STORAGE_KEY, String(storageId))
}
