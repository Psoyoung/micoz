// 관리자 통계 셀 — 출처: 원본 admin/admin-primitives.jsx Stat
import type { ReactNode } from 'react'
import { AIcon } from './icons'

type Props = {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  delta?: ReactNode
  deltaPositive?: boolean
  accent?: string
}

export default function Stat({ label, value, sub, delta, deltaPositive = true, accent }: Props) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--ad-line)', padding: '22px 24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 138 }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, width: 32, height: 3, background: accent }} />}
      <div>
        <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontFamily: 'var(--serif-en)', fontSize: 32, fontWeight: 400, color: 'var(--ad-ink)', marginTop: 10, letterSpacing: '-0.01em', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--ad-muted)', marginTop: 6, fontFamily: 'var(--mono)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 }}>
        {delta && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'var(--mono)', color: deltaPositive ? '#3a8a5a' : '#c14d4d', letterSpacing: '0.04em' }}>
            {deltaPositive ? AIcon.arrowUp(11) : AIcon.arrowDn(11)} {delta}
          </span>
        )}
      </div>
    </div>
  )
}
