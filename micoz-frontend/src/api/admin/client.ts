// 관리자 전용 axios 클라이언트 — 출처 계약: docs/admin_api.md §1.
// 사용자 client.ts 와 구조 동일(봉투 code 분기·refresh 로테이션)하되, 토큰은 micoz.admin.* 를 쓰고
// 강제 로그아웃은 /admin/login 으로 보낸다(계획 D2 — 인스턴스 분리로 사용자 토큰과 완전 격리).
//   - HTTP 200 이라도 code !== 'SUCCESS' 면 비즈니스 오류(§1.2 함정) → ApiError throw.
//   - 401/403 은 Security 단에서 실제 HTTP status(§1.1) → ApiError 로 정규화.
// refresh(§1.1 참고박스): 공용 POST /api/v1/auth/refresh 를 관리자 refresh 토큰으로 호출.
//   비활성 관리자면 refresh 거부(AUTH_TOKEN_INVALID) → 강제 로그아웃("비활성 관리자 세션 만료").
// ApiError/ApiErrorCode 는 사용자 client 와 공유(React Query 재시도·에러 매핑 일관).
import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '../types'
import { ApiError, type ApiErrorCode, API_BASE_URL } from '../client'
import { getAdminAccessToken, getAdminRefreshToken, setAdminTokens, clearAdminTokens } from '../adminToken'

// 강제 로그아웃 핸들러 — AdminAuthContext 가 등록(토큰 재사용/refresh 실패 시 user clear + /admin/login).
let onAdminAuthFailure: (() => void) | null = null
export function setAdminAuthFailureHandler(handler: (() => void) | null): void {
  onAdminAuthFailure = handler
}

export const adminClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// refresh 전용 bare 인스턴스 — 인터셉터 없음(재귀 방지).
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// 동시 요청을 단일 refresh 로 큐잉
let refreshInFlight: Promise<void> | null = null
function refreshTokens(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}
async function doRefresh(): Promise<void> {
  const refreshToken = getAdminRefreshToken()
  if (!refreshToken) throw new ApiError('AUTH_TOKEN_INVALID', '리프레시 토큰이 없습니다.', 401)
  let body: ApiResponse<{ accessToken: string; refreshToken: string }> | undefined
  try {
    const res = await refreshClient.post('/auth/refresh', { refreshToken })
    body = res.data
  } catch (e) {
    const ae = e as AxiosError<ApiResponse<unknown>>
    throw new ApiError((ae.response?.data?.code as ApiErrorCode) ?? 'AUTH_TOKEN_INVALID', ae.response?.data?.message ?? '토큰 갱신에 실패했습니다.', ae.response?.status ?? 401)
  }
  // 200 + code != SUCCESS(재사용 탐지·비활성 관리자 등) 도 실패로 간주
  if (!body || body.code !== 'SUCCESS' || !body.data) {
    throw new ApiError((body?.code as ApiErrorCode) ?? 'AUTH_TOKEN_INVALID', body?.message ?? '토큰 갱신에 실패했습니다.', 200)
  }
  setAdminTokens(body.data.accessToken, body.data.refreshToken)
}

function forceLogout(): void {
  clearAdminTokens()
  onAdminAuthFailure?.()
}

// 요청: adminAccessToken 있으면 Bearer 주입
adminClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAdminAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// 응답: 봉투 언랩 + code 분기 + refresh 로테이션
adminClient.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown> | undefined
    // 정상 봉투인데 SUCCESS 가 아니면(HTTP 200 비즈니스 오류) throw
    if (body && typeof body.code === 'string' && body.code !== 'SUCCESS') {
      throw new ApiError(body.code as ApiErrorCode, body.message ?? '요청을 처리하지 못했습니다.', response.status)
    }
    return response
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status ?? 0
    const body = error.response?.data
    const code = body?.code
    const isAuthEndpoint = original?.url?.includes('/auth/') // login/refresh 는 refresh 트리거 제외

    // 만료성 401 → refresh 후 원요청 1회 재시도.
    // 백엔드는 만료 토큰에 AUTH_UNAUTHORIZED(401)를 내려준다(§1.1) → 세션 있으면 refresh 시도.
    const isExpiredish = status === 401 && (code === 'AUTH_TOKEN_EXPIRED' || code === 'AUTH_UNAUTHORIZED')
    const hasSession = !!getAdminAccessToken() && !!getAdminRefreshToken()

    if (isExpiredish && hasSession && original && !original._retry && !isAuthEndpoint) {
      original._retry = true
      try {
        await refreshTokens()
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${getAdminAccessToken()}`
        return await adminClient(original)
      } catch (refreshErr) {
        forceLogout() // refresh 실패/재사용 탐지/비활성 관리자 → 강제 로그아웃
        return Promise.reject(refreshErr instanceof ApiError ? refreshErr : new ApiError('AUTH_TOKEN_INVALID', '세션이 만료되었습니다.', 401))
      }
    }

    // 재사용 탐지/무효 토큰이 일반 요청에서 직접 온 경우도 강제 로그아웃
    if (code === 'AUTH_TOKEN_INVALID' && !isAuthEndpoint) {
      forceLogout()
    }

    if (body && typeof body.code === 'string') {
      return Promise.reject(new ApiError(body.code as ApiErrorCode, body.message ?? error.message, status))
    }
    return Promise.reject(new ApiError('UNKNOWN', error.message || '네트워크 오류가 발생했습니다.', status))
  },
)

// ─── 타입드 래퍼 (봉투의 data 를 언랩해 T 로 반환) ───
export async function adminGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await adminClient.get<ApiResponse<T>>(url, config)
  return res.data.data as T
}
export async function adminPost<T>(url: string, payload?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await adminClient.post<ApiResponse<T>>(url, payload, config)
  return res.data.data as T
}
export async function adminPatch<T>(url: string, payload?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await adminClient.patch<ApiResponse<T>>(url, payload, config)
  return res.data.data as T
}
export async function adminPut<T>(url: string, payload?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await adminClient.put<ApiResponse<T>>(url, payload, config)
  return res.data.data as T
}
export async function adminDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await adminClient.delete<ApiResponse<T>>(url, config)
  return res.data.data as T
}
