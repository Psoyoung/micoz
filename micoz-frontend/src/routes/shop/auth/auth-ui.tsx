// auth 공통 UI — 출처: 원본 shop/screens-auth-cart.jsx AuthShell/FieldRow/FindFieldRow/CheckRow
// 입력 focus 테두리는 .auth-input:focus 로 이관(원본 JS onFocus/onBlur). 푸터는 ShopLayout 이 렌더.
import type { ReactNode } from 'react'
import { Icon } from '../../../components/shop/icons'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main style={{ background: '#ffffff', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '64px 24px 160px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>{children}</div>
    </main>
  )
}

// value/onChange 가 주어지면 제어 컴포넌트로 동작(로그인 연동). 미지정 시 기존처럼 비제어(signup/find).
export function FieldRow({ label, placeholder, type = 'text', value, onChange, autoComplete }: { label: string; placeholder?: string; type?: string; value?: string; onChange?: (v: string) => void; autoComplete?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontFamily: 'var(--serif-en)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.25em', marginBottom: 8, textTransform: 'uppercase' }}>{label}</label>
      <input
        className="auth-input"
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...(onChange ? { value: value ?? '', onChange: (e) => onChange(e.target.value) } : {})}
        style={{ width: '100%', padding: '14px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--line-strong)', fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)', outline: 'none', borderRadius: 0 }}
      />
    </div>
  )
}

// value/onChange 가 주어지면 제어 컴포넌트(find-id/reset 연동). 미지정 시 비제어.
export function FindFieldRow({ label, placeholder, type = 'text', value, onChange, autoComplete }: { label: string; placeholder?: string; type?: string; value?: string; onChange?: (v: string) => void; autoComplete?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontFamily: 'var(--serif-en)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.25em', marginBottom: 8, textTransform: 'uppercase' }}>{label}</label>
      <input
        className="auth-input"
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...(onChange ? { value: value ?? '', onChange: (e) => onChange(e.target.value) } : {})}
        style={{ width: '100%', padding: '14px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--line-strong)', fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)', outline: 'none', borderRadius: 0 }}
      />
    </div>
  )
}

export function CheckRow({ children, checked, onClick, bold }: { children: ReactNode; checked: boolean; onClick: () => void; bold?: boolean }) {
  return (
    <label onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', cursor: 'pointer', fontSize: bold ? 14 : 13, color: 'var(--ink)', fontWeight: bold ? 500 : 400 }}>
      <span
        style={{
          width: 18,
          height: 18,
          background: checked ? 'var(--plum-700)' : 'transparent',
          border: `1.5px solid ${checked ? 'var(--plum-700)' : 'var(--line-strong)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && Icon.check(12, 'var(--cream)')}
      </span>
      {children}
    </label>
  )
}
