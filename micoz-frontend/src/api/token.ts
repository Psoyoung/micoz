// 토큰 저장소 — access/refresh 를 localStorage 에 보관하는 헬퍼.
// (인증 로직·refresh 로테이션은 Phase 1b 에서. 여기선 순수 저장소 접근만.)

const ACCESS_KEY = 'micoz.accessToken'
const REFRESH_KEY = 'micoz.refreshToken'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function setAccessToken(accessToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
