// 뷰포트 분기 훅 — 768px 경계. 초기값을 마운트 시 동기 계산(플래시 없음) + change 리스너로 갱신.
// 데스크탑/모바일 중 한쪽 트리만 렌더하기 위한 단일 진실원.
import { useState, useEffect } from 'react'

const QUERY = '(max-width: 768px)'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => window.matchMedia(QUERY).matches)

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    setIsMobile(mql.matches) // 렌더~이펙트 사이 변경 대비 동기화
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
