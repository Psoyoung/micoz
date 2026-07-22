// axios 클라이언트 — 출처 계약: docs/micoz_api.md §0~§1.
// 핵심: 응답 봉투(ApiResponse) 를 바디 `code` 로 분기한다.
//   - HTTP 200 이라도 code !== 'SUCCESS' 면 비즈니스 오류(명세 §0.4 함정) → ApiError throw.
//   - 401/403 은 Security 단에서 실제 HTTP status 를 설정(envelope 없거나 data 생략) → ApiError 로 정규화.
// refresh 로테이션(§1.3): AUTH_TOKEN_EXPIRED → /auth/refresh 1회 → 원요청 재시도. 동시요청은 단일 refresh 로 큐잉.
//   재사용 탐지(AUTH_TOKEN_INVALID)·refresh 실패 → 토큰 clear + 강제 로그아웃 콜백.
import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, ErrorCode } from './types'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './token'

// 타입드 에러 — code 로 분기, httpStatus 로 재시도 정책 결정.
// 'UNKNOWN' 은 네트워크 오류 등 봉투가 없는 경우의 폴백.
export type ApiErrorCode = ErrorCode | 'UNKNOWN'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly httpStatus: number
  constructor(code: ApiErrorCode, message: string, httpStatus: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

// 강제 로그아웃 핸들러 — AuthContext 가 등록(토큰 재사용/refresh 실패 시 user clear + /login).
let onAuthFailure: (() => void) | null = null
export function setAuthFailureHandler(handler: (() => void) | null): void {
  onAuthFailure = handler
}

// API base — dev: VITE_API_BASE_URL 미설정 → '' + '/api/v1' = 상대경로(Vite 프록시). // prod: 정적사이트 빌드
// env VITE_API_BASE_URL=https://<백엔드> → 절대 URL(크로스오리진 + 백엔드 CORS). 관리자 client도 재사용.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '') + '/api/v1'

export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// refresh 전용 bare 인스턴스 — 인터셉터 없음(재귀 방지, §1.3 "/auth/refresh 자체엔 재귀 금지").
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
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new ApiError('AUTH_TOKEN_INVALID', '리프레시 토큰이 없습니다.', 401)
  let body: ApiResponse<{ accessToken: string; refreshToken: string }> | undefined
  try {
    const res = await refreshClient.post('/auth/refresh', { refreshToken })
    body = res.data
  } catch (e) {
    const ae = e as AxiosError<ApiResponse<unknown>>
    throw new ApiError((ae.response?.data?.code as ApiErrorCode) ?? 'AUTH_TOKEN_INVALID', ae.response?.data?.message ?? '토큰 갱신에 실패했습니다.', ae.response?.status ?? 401)
  }
  // 200 + code != SUCCESS(재사용 탐지 등) 도 실패로 간주
  if (!body || body.code !== 'SUCCESS' || !body.data) {
    throw new ApiError((body?.code as ApiErrorCode) ?? 'AUTH_TOKEN_INVALID', body?.message ?? '토큰 갱신에 실패했습니다.', 200)
  }
  setTokens(body.data.accessToken, body.data.refreshToken)
}

function forceLogout(): void {
  clearTokens()
  onAuthFailure?.()
}

// 요청: accessToken 있으면 Bearer 주입 (§0.5)
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// 응답: 봉투 언랩 + code 분기 + refresh 로테이션
client.interceptors.response.use(
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
    const isAuthEndpoint = original?.url?.includes('/auth/') // login/refresh/logout 은 refresh 트리거 제외

    // 만료성 401 → refresh 후 원요청 1회 재시도.
    // ※ 백엔드는 만료 토큰에 AUTH_TOKEN_EXPIRED 가 아니라 AUTH_UNAUTHORIZED(401)를 내려준다(실측).
    //   그래서 "저장된 세션(access+refresh)이 있는데 401 만료성 코드"면 refresh 를 시도한다.
    //   세션 없음(비로그인)·이미 재시도·auth 엔드포인트는 제외 → 무한루프·불필요 refresh 방지.
    const isExpiredish = status === 401 && (code === 'AUTH_TOKEN_EXPIRED' || code === 'AUTH_UNAUTHORIZED')
    const hasSession = !!getAccessToken() && !!getRefreshToken()

    if (isExpiredish && hasSession && original && !original._retry && !isAuthEndpoint) {
      original._retry = true
      try {
        await refreshTokens()
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${getAccessToken()}`
        return await client(original)
      } catch (refreshErr) {
        forceLogout() // refresh 실패/재사용 탐지 → 강제 로그아웃
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
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.get<ApiResponse<T>>(url, config)
  return res.data.data as T
}
export async function apiPost<T>(url: string, payload?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.post<ApiResponse<T>>(url, payload, config)
  return res.data.data as T
}
export async function apiPatch<T>(url: string, payload?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.patch<ApiResponse<T>>(url, payload, config)
  return res.data.data as T
}
export async function apiPut<T>(url: string, payload?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.put<ApiResponse<T>>(url, payload, config)
  return res.data.data as T
}
export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await client.delete<ApiResponse<T>>(url, config)
  return res.data.data as T
}
