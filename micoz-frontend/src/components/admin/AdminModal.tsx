// 관리자 모달 베이스 — 출처: 원본 admin/admin-views-2.jsx 의 *Modal 공통 패턴(백드롭+Esc+스크롤잠금+modalIn).
// 뷰 단계의 각 *Modal(ProductForm/OrderDetail 등)이 이 베이스 위에 내용을 얹는다. --ad-* 토큰 사용.
import type { ReactNode } from 'react'
import { useModalDismiss } from '../../lib/useModalDismiss'

type Props = {
  open: boolean
  onClose: () => void
  kicker?: ReactNode
  title?: ReactNode
  width?: number
  footer?: ReactNode
  children: ReactNode
}

export default function AdminModal({ open, onClose, kicker, title, width = 640, footer, children }: Props) {
  useModalDismiss(onClose, open)
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15, 10, 28, 0.55)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'modalIn .18s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--ad-paper)', width: `min(${width}px, 100%)`, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'auto', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', border: '1px solid var(--ad-line)' }}
      >
        {(title !== undefined || kicker !== undefined) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 26px', borderBottom: '1px solid var(--ad-line)' }}>
            <div style={{ minWidth: 0 }}>
              {kicker !== undefined && <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.28em', color: 'var(--ad-muted)', marginBottom: 6 }}>{kicker}</div>}
              {title !== undefined && <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: 'var(--ad-ink)' }}>{title}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ad-iconbtn"
              style={{ width: 32, height: 32, border: '1px solid var(--ad-line-strong)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--ad-ink)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        )}
        <div style={{ padding: 26 }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 26px', borderTop: '1px solid var(--ad-line)' }}>{footer}</div>}
      </div>
    </div>
  )
}
