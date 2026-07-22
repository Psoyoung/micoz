// 관리자 상단 바 — 출처: 원본 admin/admin-primitives.jsx Topbar
// 로그아웃 아이콘 hover 는 CSS .ad-iconbtn 로 이관(배경 인라인 제외).
import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
  crumbs?: string[]
  rightExtra?: ReactNode
  onLogout?: () => void
}

export default function Topbar({ title, crumbs = [], rightExtra, onLogout }: Props) {
  return (
    <header style={{ height: 64, padding: '0 32px', borderBottom: '1px solid var(--ad-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--ad-paper)', position: 'sticky', top: 0, zIndex: 10 }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.18em', marginBottom: 3 }}>
          {crumbs.map((c, i) => (
            <span key={i}>
              {c}
              {i < crumbs.length - 1 && <span style={{ margin: '0 8px', opacity: 0.5 }}>/</span>}
            </span>
          ))}
        </div>
        <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ad-ink)' }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {rightExtra}
        <button
          type="button"
          title="로그아웃"
          onClick={onLogout}
          className="ad-iconbtn"
          style={{ position: 'relative', width: 36, height: 36, border: '1px solid var(--ad-line)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ad-ink)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" />
            <path d="M10 17l-5-5 5-5" />
            <path d="M5 12h12" />
          </svg>
        </button>
      </div>
    </header>
  )
}
