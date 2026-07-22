// 마이페이지 공통 UI/스타일 — 출처: 원본 shop/screens-desktop2.jsx 의 MpField/MpInput + style 상수.
// 각 모달이 공통으로 쓰던 Esc 닫기 + body 스크롤 잠금은 useModalDismiss 훅으로 추출.
import { useEffect, type CSSProperties, type ReactNode } from 'react'

export function useModalDismiss(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])
}

export function MpField({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label style={{ display: 'block', gridColumn: full ? '1 / -1' : 'auto' }}>
      <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10.5, letterSpacing: '0.24em', color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
      {children}
    </label>
  )
}

export function MpInput({
  value,
  onChange,
  placeholder,
  mono,
  type = 'text',
}: {
  value?: string
  onChange?: (v: string) => void
  placeholder?: string
  mono?: boolean
  type?: string
}) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: 'var(--paper)',
        border: '1px solid var(--line-strong)',
        fontFamily: mono ? 'var(--serif-en)' : 'var(--sans)',
        fontSize: 13.5,
        color: 'var(--ink)',
        outline: 'none',
        letterSpacing: mono ? '0.04em' : 0,
      }}
    />
  )
}

export function ModalClose({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" onClick={onClose} style={mypageModalClose}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}

export const mypagePrimaryBtn: CSSProperties = {
  padding: '10px 22px',
  background: 'var(--plum-700)',
  color: 'var(--cream)',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--sans)',
  fontSize: 12.5,
  letterSpacing: '0.04em',
}
export const mypageGhostBtn: CSSProperties = {
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid var(--line-strong)',
  color: 'var(--ink)',
  cursor: 'pointer',
  fontFamily: 'var(--sans)',
  fontSize: 12,
  letterSpacing: '0.04em',
}
export const mypageSelect: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--paper)',
  border: '1px solid var(--line-strong)',
  fontFamily: 'var(--sans)',
  fontSize: 13.5,
  color: 'var(--ink)',
  outline: 'none',
}
export const mypageBackdrop: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 10, 28, 0.55)',
  backdropFilter: 'blur(2px)',
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 32,
  animation: 'modalIn .18s ease',
}
export const mypageModal: CSSProperties = {
  background: 'var(--cream)',
  width: 'min(640px, 100%)',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)',
}
export const mypageModalHead: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '22px 26px',
  borderBottom: '1px solid var(--line)',
}
export const mypageModalKicker: CSSProperties = {
  fontFamily: 'var(--serif-en)',
  fontSize: 10.5,
  letterSpacing: '0.28em',
  color: 'var(--muted)',
  marginBottom: 6,
}
export const mypageModalTitle: CSSProperties = {
  fontFamily: 'var(--serif)',
  fontSize: 22,
  fontWeight: 400,
  color: 'var(--plum-800)',
}
export const mypageModalClose: CSSProperties = {
  width: 32,
  height: 32,
  background: 'transparent',
  border: '1px solid var(--line-strong)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: 'var(--ink)',
}
export const mypageModalFoot: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '16px 26px',
  borderTop: '1px solid var(--line)',
}
