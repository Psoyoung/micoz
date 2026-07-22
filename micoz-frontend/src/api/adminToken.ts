// 관리자 토큰 저장소 — 사용자 토큰(micoz.*)과 별도 키(micoz.admin.*).
// 근거: 한 브라우저에 CUSTOMER + ADMIN 동시 로그인 가능 → 완전 분리(계획 D2).
// 순수 저장소 접근만. 주입/refresh 로테이션은 api/admin/client.ts.

const ADMIN_ACCESS_KEY = 'micoz.admin.accessToken'
const ADMIN_REFRESH_KEY = 'micoz.admin.refreshToken'

export function getAdminAccessToken(): string | null {
  return localStorage.getItem(ADMIN_ACCESS_KEY)
}

export function getAdminRefreshToken(): string | null {
  return localStorage.getItem(ADMIN_REFRESH_KEY)
}

export function setAdminTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ADMIN_ACCESS_KEY, accessToken)
  localStorage.setItem(ADMIN_REFRESH_KEY, refreshToken)
}

export function clearAdminTokens(): void {
  localStorage.removeItem(ADMIN_ACCESS_KEY)
  localStorage.removeItem(ADMIN_REFRESH_KEY)
}
