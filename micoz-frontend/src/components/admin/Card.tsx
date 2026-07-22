// 관리자 카드 컨테이너 — 출처: 원본 admin/admin-primitives.jsx Card
import type { CSSProperties, ReactNode } from 'react'

type Props = {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  padding?: number
  style?: CSSProperties
}

export default function Card({ title, subtitle, action, children, padding = 22, style = {} }: Props) {
  return (
    <section style={{ background: '#fff', border: '1px solid var(--ad-line)', ...style }}>
      {(title || action) && (
        <header style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--ad-line)' }}>
          <div style={{ minWidth: 0 }}>
            {title && <div style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 500, color: 'var(--ad-ink)' }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', marginTop: 3, whiteSpace: 'nowrap' }}>{subtitle}</div>}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </header>
      )}
      <div style={{ padding }}>{children}</div>
    </section>
  )
}
