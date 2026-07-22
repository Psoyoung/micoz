// 관리자 인증 컨텍스트 — 사용자 AuthContext 와 분리(별도 토큰·별도 client, 계획 D2).
// admin user(GET /admin/me)·isAuthenticated·login·logout·세션 복원.
// refresh 로테이션/강제 로그아웃은 api/admin/client.ts 가 처리하고, 여기선 강제 로그아웃 콜백만 등록.
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin, getAdminMe, type AdminMeResponse } from '../api/admin/auth'
import { setAdminTokens, clearAdminTokens, getAdminAccessToken } from '../api/adminToken'
import { setAdminAuthFailureHandler } from '../api/admin/client'

// 프론트 뷰모델 — DTO(AdminMeResponse) 에서 화면에 필요한 식별 정보만.
export interface AdminUser {
  userSeq: number
  userId: string
  role: string // "ADMIN"
}

function toAdminUser(d: AdminMeResponse): AdminUser {
  return { userSeq: d.userSeq, userId: d.userId, role: d.role }
}

interface AdminAuthContextValue {
  admin: AdminUser | null
  isAuthenticated: boolean
  loading: boolean // 세션 복원 중 여부
  login: (userId: string, userPw: string) => Promise<void>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true) // 초기 세션 복원 중

  // 강제 로그아웃(토큰 재사용/refresh 실패/비활성 관리자) — client 에서 호출. 토큰 clear 는 client 가 이미 수행.
  useEffect(() => {
    setAdminAuthFailureHandler(() => {
      setAdmin(null)
      navigate('/admin/login')
    })
    return () => setAdminAuthFailureHandler(null)
  }, [navigate])

  // 마운트 시 세션 복원 — adminAccessToken 있으면 GET /admin/me
  useEffect(() => {
    let alive = true
    void (async () => {
      if (!getAdminAccessToken()) {
        setLoading(false)
        return
      }
      try {
        const me = await getAdminMe()
        if (alive) setAdmin(toAdminUser(me))
      } catch {
        clearAdminTokens()
        if (alive) setAdmin(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (userId: string, userPw: string) => {
    const tokens = await adminLogin({ userId, userPw })
    setAdminTokens(tokens.accessToken, tokens.refreshToken)
    const me = await getAdminMe()
    setAdmin(toAdminUser(me))
  }, [])

  // 관리자 로그아웃 API 는 명세에 없음(§F) → 로컬 토큰 정리 + 로그인 화면.
  const logout = useCallback(() => {
    clearAdminTokens()
    setAdmin(null)
    navigate('/admin/login')
  }, [navigate])

  const value = useMemo<AdminAuthContextValue>(
    () => ({ admin, isAuthenticated: !!admin, loading, login, logout }),
    [admin, loading, login, logout],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth 는 AdminAuthProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
