// 관리자 사이드바 — 출처: 원본 admin/admin-primitives.jsx Sidebar/NAV
// 사이드바 색은 원본 하드코딩(어두운 플럼) 보존. nav hover 는 CSS .ad-nav 로 이관(배경 인라인 제외).
import type { CSSProperties } from 'react'
import { useAdminAuth } from '../../auth/AdminAuthContext'
import { AIcon } from './icons'

const NAV: { key: string; label: string; icon: string; code: string }[] = [
  { key: 'dashboard', label: '대시보드', icon: 'dash', code: 'OVERVIEW' },
  { key: 'members', label: '회원관리', icon: 'user', code: 'MEMBERS' },
  { key: 'categories', label: '카테고리관리', icon: 'folder', code: 'CATEGORY' },
  { key: 'products', label: '상품관리', icon: 'box', code: 'PRODUCT' },
  { key: 'orders', label: '주문관리', icon: 'cart', code: 'ORDER' },
  { key: 'returns', label: '반품·교환 관리', icon: 'cart', code: 'RETURNS' },
  { key: 'inquiries', label: '1:1 문의', icon: 'chat', code: 'INQUIRY' },
  { key: 'banner', label: '메인 배너 설정', icon: 'chart', code: 'BANNER' },
  { key: 'shipping', label: '배송 설정', icon: 'box', code: 'SHIP' },
  { key: 'team', label: '관리자 계정 관리', icon: 'cog', code: 'TEAM' },
]

const navHeader: CSSProperties = { fontSize: 10, letterSpacing: '0.32em', color: '#5a4d72', padding: '8px 14px 10px', fontFamily: 'var(--mono)', textTransform: 'uppercase' }

export default function Sidebar({ current, onNav }: { current: string; onNav: (key: string) => void }) {
  const { admin } = useAdminAuth()
  const initials = (admin?.userId ?? '').slice(0, 2).toUpperCase() || 'AD'
  return (
    <aside style={{ width: 248, background: '#2d2347', color: '#ddd5e8', display: 'flex', flexDirection: 'column', borderRight: '1px solid #3a3056', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}>
      {/* logo */}
      <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid #3a3056', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 18, letterSpacing: '0.32em', color: '#f5f1ea', paddingLeft: '0.32em' }}>MICOZ</div>
          <div style={{ fontSize: 10, letterSpacing: '0.28em', color: '#8a7ba0', marginTop: 6, fontFamily: 'var(--mono)' }}>ADMIN · v2.6.1</div>
        </div>
        <span style={{ fontSize: 9, letterSpacing: '0.2em', color: '#8a7ba0', fontFamily: 'var(--mono)', padding: '2px 6px', border: '1px solid #2a2240' }}>PROD</span>
      </div>

      {/* nav */}
      <nav style={{ padding: '14px 12px', flex: 1, background: '#3a2e58' }}>
        <div style={navHeader}>운영</div>
        {NAV.map((n) => {
          const active = current === n.key
          return (
            <button
              key={n.key}
              onClick={() => onNav(n.key)}
              className={`ad-nav${active ? ' ad-nav--active' : ''}`}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', color: active ? '#f5f1ea' : '#c0b3d4', border: 'none', borderLeft: `2px solid ${active ? '#c4b0d8' : 'transparent'}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--sans)', fontSize: 13.5, transition: 'background .15s', position: 'relative' }}
            >
              <span style={{ opacity: active ? 1 : 0.7, display: 'flex' }}>{AIcon[n.icon](17)}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
            </button>
          )
        })}
      </nav>

      {/* footer / user */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid #1a1429', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(155deg, #3a2552, #9a7fb8)', color: '#f5f1ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif-en)', fontSize: 13, letterSpacing: '0.04em', flexShrink: 0 }}>{initials}</div>
        <div style={{ lineHeight: 1.25, minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#f5f1ea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin?.userId ?? '-'}</div>
          <div style={{ fontSize: 10, color: '#7c6f93', fontFamily: 'var(--mono)', letterSpacing: '0.08em', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin?.role ?? ''}</div>
        </div>
      </div>
    </aside>
  )
}
