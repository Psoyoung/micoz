// 관리자 매퍼 공용 포맷 — DTO 의 ISO 일시/금액을 화면 문자열로.
// (shop lib/format.ts 를 건드리지 않도록 admin 전용으로 둔다.)

// OffsetDateTime "2026-05-01T09:00:00+09:00" → "2026-05-01"
export function fmtDate(iso?: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

// → "2026-05-01 09:00"
export function fmtDateTime(iso?: string | null): string {
  if (!iso) return ''
  const d = iso.slice(0, 10)
  const t = iso.slice(11, 16)
  return t ? `${d} ${t}` : d
}

// BigDecimal(문자열/숫자) → number
export function toNum(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

// number → "₩12,345"
export function won(v: unknown): string {
  return '₩' + toNum(v).toLocaleString('ko-KR')
}
