// 관리자 공용 확인 다이얼로그 — 삭제/되돌릴 수 없는 액션 확인 + 변이 진행/에러 표시.
// A3a(삭제 차단 CATEGORY_HAS_CHILDREN 등)·A3b(반품 complete 등)에서 재사용.
import type { ReactNode } from 'react'
import { adminErrorMessage } from '../../api/admin/errors'
import { useModalDismiss } from '../../lib/useModalDismiss'

type Props = {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean // 변이 진행 중(버튼 비활성)
  error?: unknown // 변이 실패 시 표시(한글 매핑)
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, title, message, confirmLabel = '확인', cancelLabel = '취소', danger = false, busy = false, error, onConfirm, onCancel }: Props) {
  useModalDismiss(onCancel, open && !busy)
  if (!open) return null

  return (
    <div onClick={() => !busy && onCancel()} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 10, 28, 0.55)', backdropFilter: 'blur(2px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'modalIn .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} className="admin-scope" style={{ background: '#fff', width: 'min(440px, 100%)', border: '1px solid var(--ad-line-strong)', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', fontFamily: 'var(--sans)', color: 'var(--ad-ink)' }}>
        <div style={{ padding: '22px 26px 8px' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500 }}>{title}</div>
          <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7, color: 'var(--ad-ink)' }}>{message}</div>
          {error != null && (
            <div role="alert" style={{ marginTop: 14, padding: '10px 12px', background: '#fbece9', border: '1px solid #e6c8c1', fontSize: 12.5, lineHeight: 1.6, color: '#8a3a2c' }}>
              {adminErrorMessage(error)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 26px', borderTop: '1px solid var(--ad-line)', background: 'var(--ad-paper-2)', marginTop: 12 }}>
          <button type="button" onClick={onCancel} disabled={busy} style={{ padding: '8px 18px', background: '#fff', color: 'var(--ad-ink)', border: '1px solid var(--ad-line-strong)', cursor: busy ? 'default' : 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, opacity: busy ? 0.5 : 1 }}>{cancelLabel}</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{ padding: '8px 18px', background: danger ? '#8a3a2c' : '#3a2552', color: '#f5f1ea', border: `1px solid ${danger ? '#8a3a2c' : '#3a2552'}`, cursor: busy ? 'default' : 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, letterSpacing: '0.02em', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? '처리 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
