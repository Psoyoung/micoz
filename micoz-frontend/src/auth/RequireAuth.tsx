// 라우트 가드 — 미인증 시 /login 리다이렉트. 세션 복원 중엔 판단 보류.
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // 세션 복원(GET /me) 중이면 깜빡임 방지를 위해 판단을 보류(렌더 보류).
  if (loading) return null

  if (!isAuthenticated) {
    // 로그인 후 원래 가려던 곳으로 복귀할 수 있도록 from 전달.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
