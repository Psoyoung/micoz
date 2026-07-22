// 통화 표기 — 출처: 원본 shop/data.jsx · admin/admin-data.jsx 의 won/wonM 헬퍼 통합.
// 쇼핑몰 won 은 '₩ '(공백 포함), 관리자 won 은 '₩'(공백 없음) + wonM 사용 → 셋으로 분리 보존.

// 쇼핑몰: '₩ 138,000'
export const won = (n: number): string => '₩ ' + n.toLocaleString('ko-KR')

// 관리자: '₩138,000' (공백 없음)
export const wonCompact = (n: number): string => '₩' + n.toLocaleString('ko-KR')

// 관리자 축약: '₩142.8M'
export const wonM = (n: number): string => '₩' + (n / 1000000).toFixed(1) + 'M'
