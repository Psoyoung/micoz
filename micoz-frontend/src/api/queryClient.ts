// React Query 클라이언트 — 재시도 정책은 ApiError 기준.
// 비즈니스 오류(4xx 및 HTTP 200 비즈니스 오류)는 결정적이므로 재시도하지 않는다.
// 서버 일시 오류(5xx)·네트워크 오류만 제한적으로 재시도.
import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './client'

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    // 5xx 만 일시 오류로 보고 제한 재시도, 그 외(4xx·200 비즈니스 오류)는 즉시 실패
    if (error.httpStatus >= 500) return failureCount < 2
    return false
  }
  // 비-ApiError(예외적 네트워크 오류 등)는 제한 재시도
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 60_000, // 1분 — 카탈로그 등 비교적 정적인 데이터 기준 합리값
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // 변이는 재시도하지 않음(중복 위험)
    },
  },
})
