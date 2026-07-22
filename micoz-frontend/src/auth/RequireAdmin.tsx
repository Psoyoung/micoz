// 관리자 라우트 가드 — 미인증/비ADMIN 시 /admin/login 리다이렉트. 세션 복원 중엔 판단 보류.
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAdminAuth } from './AdminAuthContext'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { admin, isAuthenticated, loading } = useAdminAuth()
  const location = useLocation()

  // 세션 복원(GET /admin/me) 중이면 깜빡임 방지를 위해 판단 보류.
  if (loading) return null

  // 미인증 또는 role !== ADMIN → 로그인. (로그인은 ADMIN 만 통과하지만 방어적으로 role 재확인.)
  if (!isAuthenticated || admin?.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
