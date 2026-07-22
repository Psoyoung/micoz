// 인증 컨텍스트 — user(GET /me)·isAuthenticated·login·logout·세션 복원.
// refresh 로테이션/강제 로그아웃은 client.ts 가 처리하고, 여기선 강제 로그아웃 콜백만 등록.
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, logout as apiLogout, getMe, type UserInfoResponse } from '../api/auth'
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from '../api/token'
import { setAuthFailureHandler } from '../api/client'

// 프론트 뷰모델 — DTO(UserInfoResponse)에서 화면에 필요한 식별 정보만 추림.
export interface AuthUser {
  userSeq: number
  userId: string
  name: string // userName
  email?: string
  phone?: string
  gradeCode?: string
  gradeName?: string
  pointBalance: number
  userRole: string
  userStatus: string
}

function toAuthUser(d: UserInfoResponse): AuthUser {
  return {
    userSeq: d.userSeq,
    userId: d.userId,
    name: d.userName,
    email: d.email,
    phone: d.phone,
    gradeCode: d.gradeCode,
    gradeName: d.gradeName,
    pointBalance: d.pointBalance,
    userRole: d.userRole,
    userStatus: d.userStatus,
  }
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean // 세션 복원 중 여부
  login: (userId: string, userPw: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true) // 초기 세션 복원 중

  // 강제 로그아웃(토큰 재사용/refresh 실패) — client.ts 에서 호출. 토큰 clear 는 client 가 이미 수행.
  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null)
      navigate('/login')
    })
    return () => setAuthFailureHandler(null)
  }, [navigate])

  // 마운트 시 세션 복원 — accessToken 있으면 GET /me
  useEffect(() => {
    let alive = true
    void (async () => {
      if (!getAccessToken()) {
        setLoading(false)
        return
      }
      try {
        const me = await getMe()
        if (alive) setUser(toAuthUser(me))
      } catch {
        clearTokens()
        if (alive) setUser(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (userId: string, userPw: string) => {
    const tokens = await apiLogin({ userId, userPw })
    setTokens(tokens.accessToken, tokens.refreshToken)
    const me = await getMe()
    setUser(toAuthUser(me))
    // [카트 병합 훅 포인트] 로컬 게스트 카트 → 서버 병합. 구현은 Phase 3 (지금 no-op).
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) await apiLogout(refreshToken)
    } catch {
      // 멱등 — 실패해도 로컬 정리는 진행
    }
    clearTokens()
    setUser(null)
    navigate('/login')
  }, [navigate])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, loading, login, logout }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 는 AuthProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
