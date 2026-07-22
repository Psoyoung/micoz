// 임시 스모크 테스트 — Phase 1a 클라이언트 동작 확인용 (앱에 import 되지 않음 → 런타임 영향 0).
// 백엔드(localhost:8080)가 떠 있어야 라이브 확인 가능.
//
// 실행법(둘 중 하나):
//   A) 브라우저 콘솔: 아래를 붙여넣기
//        const { runSmoke } = await import('/src/api/_smoke.ts'); await runSmoke();
//   B) main.tsx 에 임시로 `import('./api/_smoke').then(m => m.runSmoke())` 추가 후 제거.
//
// 검증 항목:
//   1) 성공 경로: GET /categories → 봉투 언랩되어 data(배열) 반환.
//   2) 에러 경로: GET /products/999999 → code=PRODUCT_NOT_FOUND 가 ApiError 로 throw.
import { apiGet, ApiError } from './client'

export type SmokeResult = {
  success: { ok: boolean; detail: string }
  error: { ok: boolean; detail: string }
}

export async function runSmoke(): Promise<SmokeResult> {
  const result: SmokeResult = {
    success: { ok: false, detail: '' },
    error: { ok: false, detail: '' },
  }

  // 1) 성공 경로 — 봉투 언랩
  try {
    const categories = await apiGet<unknown[]>('/categories')
    result.success.ok = Array.isArray(categories)
    result.success.detail = `GET /categories → ${Array.isArray(categories) ? `배열 ${categories.length}건 언랩 성공` : `예상과 다른 형태: ${typeof categories}`}`
  } catch (e) {
    result.success.detail = `GET /categories 실패: ${e instanceof ApiError ? `${e.code} (${e.httpStatus})` : String(e)}`
  }

  // 2) 에러 경로 — PRODUCT_NOT_FOUND 가 ApiError 로 throw 되어야 정상
  try {
    await apiGet('/products/999999')
    result.error.detail = 'GET /products/999999 가 throw 하지 않음 (에러 분기 실패)'
  } catch (e) {
    if (e instanceof ApiError && e.code === 'PRODUCT_NOT_FOUND') {
      result.error.ok = true
      result.error.detail = `ApiError 정상 throw: ${e.code} (httpStatus ${e.httpStatus})`
    } else if (e instanceof ApiError) {
      result.error.detail = `ApiError 지만 code 불일치: ${e.code} (${e.httpStatus})`
    } else {
      result.error.detail = `ApiError 가 아님: ${String(e)}`
    }
  }

  // eslint-disable-next-line no-console
  console.log('[micoz smoke]', result)
  return result
}
