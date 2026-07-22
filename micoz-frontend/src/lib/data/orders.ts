// 주문번호 생성(클라이언트 목업용) — shop 체크아웃/주문완료가 사용.
// 관리자 주문 mock(ORDERS)은 A5 정리에서 제거(주문관리는 실 API 연동).
// 실제 order_no 는 API 단계에서 서버가 발급(MZ-...).
export function generateOrderNo(date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const seq = String(date.getHours() * 100 + date.getMinutes()).padStart(4, '0')
  return `O-${yy}${mm}${dd}-${seq}`
}
