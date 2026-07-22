// 관리자 인증 API — 출처: docs/admin_api.md §F(F-1 로그인 · F-2 본인정보).
// DTO 는 명세 그대로. 뷰모델 매핑은 AdminAuthContext.
import { adminGet, adminPost } from './client'

// F-1 LoginRequest (사용자와 동일 형태)
export interface AdminLoginRequest {
  userId: string
  userPw: string
}

// F-1 TokenResponse (accessTokenExpiresIn = 초, 기본 1800)
export interface AdminTokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string // "Bearer"
  accessTokenExpiresIn: number
}

// F-2 AdminMeResponse
export interface AdminMeResponse {
  userSeq: number
  userId: string
  role: string // "ADMIN"
}

// POST /api/v1/admin/auth/login → 토큰 세트
// 실패(아이디/비번 불일치·role≠ADMIN·SUSPENDED)는 전부 AUTH_INVALID_CREDENTIALS(401)로 동일 응답(열거 방지).
export function adminLogin(body: AdminLoginRequest): Promise<AdminTokenResponse> {
  return adminPost<AdminTokenResponse>('/admin/auth/login', body)
}

// GET /api/v1/admin/me → 현재 관리자
export function getAdminMe(): Promise<AdminMeResponse> {
  return adminGet<AdminMeResponse>('/admin/me')
}
