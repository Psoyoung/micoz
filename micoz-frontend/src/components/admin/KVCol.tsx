// 관리자 라벨-값 세로 쌍(label 위, value 아래) — 출처: 원본 admin/admin-views-2.jsx KVCol
// 2곳(반품 상세·문의 상세) 이상에서 사용 → components/admin 으로 승격.
export default function KVCol({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={{ fontSize: 10, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 12.5, fontFamily: mono ? 'var(--mono)' : 'var(--sans)', color: 'var(--ad-ink)', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}
