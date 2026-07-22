// 인증/계정 API — 출처: docs/micoz_api.md §1(Auth) · §2.1(GET /me).
// DTO 는 명세서 그대로(userId/userPw/userName 등). 뷰모델 매핑은 AuthContext 에서.
import { apiGet, apiPost } from './client'

// §1.2 LoginRequest
export interface LoginRequest {
  userId: string
  userPw: string
}

// §1.2/§1.3 TokenResponse
export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string // 항상 "Bearer"
  accessTokenExpiresIn: number // 초 (1800)
}

// §2.1 UserInfoResponse (birthDate/zip/address 등은 명세상 "(추정)")
export interface UserInfoResponse {
  userSeq: number
  userId: string
  userName: string
  userRole: string // CUSTOMER 등
  userStatus: string // ACTIVE/INACTIVE
  email?: string
  phone?: string
  birthDate?: string
  zipCode?: string
  address?: string
  addressDetail?: string
  gradeCode?: string // MEMBER/SELLER/MASTER/SENIOR/EXECUTIVE
  gradeName?: string // 회원/셀러/마스터/상무/전무
  referrerUserId?: string
  pointBalance: number
  lastLoginDate?: string
}

// §1.1 SignupRequest (Swagger 계약: serviceYn/privacyYn/marketingYn 은 'Y'/'N' 문자열, serviceAgreed/privacyAgreed 는 파생 getter)
export interface SignupRequest {
  userId: string // 4~50
  userPw: string // 8~64
  userName: string // ~100
  email?: string
  phone?: string
  serviceYn: 'Y' | 'N' // 필수 동의
  privacyYn: 'Y' | 'N' // 필수 동의
  marketingYn?: 'Y' | 'N'
  referrerUserId?: string
}
export interface SignupResponse {
  userSeq: number
  userId: string
  referrerUserId?: string
}

// §1.5 FindIdRequest
export interface FindIdRequest {
  userName: string
  email: string
}
export interface FindIdResponse {
  userId?: string // 본인확인 미통과 시 null(직렬화 생략) — 열거방지
}

// §1.6 ResetPasswordRequest
export interface ResetPasswordRequest {
  userId: string
  userName: string
  email: string
  newPassword: string // 8~64
}

// POST /api/v1/auth/login → 토큰
export function login(body: LoginRequest): Promise<TokenResponse> {
  return apiPost<TokenResponse>('/auth/login', body)
}

// POST /api/v1/auth/signup → 가입(자동 로그인 아님)
export function signup(body: SignupRequest): Promise<SignupResponse> {
  return apiPost<SignupResponse>('/auth/signup', body)
}

// POST /api/v1/auth/find-id → userId(미일치도 SUCCESS, userId 생략=열거방지)
export function findId(body: FindIdRequest): Promise<FindIdResponse> {
  return apiPost<FindIdResponse>('/auth/find-id', body)
}

// POST /api/v1/auth/reset-password → 비밀번호 재설정(미일치도 동일 SUCCESS)
export function resetPassword(body: ResetPasswordRequest): Promise<void> {
  return apiPost<void>('/auth/reset-password', body)
}

// POST /api/v1/auth/logout → 본인 refresh 1건 revoke (멱등)
export function logout(refreshToken: string): Promise<void> {
  return apiPost<void>('/auth/logout', { refreshToken })
}

// GET /api/v1/me → 현재 사용자
export function getMe(): Promise<UserInfoResponse> {
  return apiGet<UserInfoResponse>('/me')
}
