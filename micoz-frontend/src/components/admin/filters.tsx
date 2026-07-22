// 관리자 필터 바 / 필터 칩 — 출처: 원본 admin/admin-primitives.jsx FilterBar/FilterChip
import type { ReactNode } from 'react'

export function FilterBar({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: '1px solid var(--ad-line)', background: 'var(--ad-paper-2)', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{children}</div>
      <div style={{ display: 'flex', gap: 8 }}>{action}</div>
    </div>
  )
}

export function FilterChip({ label, value, active, onClick }: { label: ReactNode; value?: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: '6px 12px', fontFamily: 'var(--sans)', fontSize: 12, background: active ? '#3a2552' : '#fff', color: active ? '#f5f1ea' : 'var(--ad-ink)', border: `1px solid ${active ? '#3a2552' : 'var(--ad-line-strong)'}`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
    >
      <span>{label}</span>
      {value !== undefined && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, opacity: 0.7, letterSpacing: '0.04em' }}>{value}</span>}
    </button>
  )
}
