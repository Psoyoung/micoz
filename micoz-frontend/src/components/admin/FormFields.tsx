// 관리자 폼 필드 프리미티브 — 출처: 원본 admin/admin-views-1.jsx Form helpers
// 2곳(카테고리 편집·배송 설정) 이상에서 사용 → components/admin 으로 승격.
// 인라인 style·CSS 변수 보존. 입력값은 원본대로 자체 useState(미제어 시드).
import { useState, type ReactNode } from 'react'

export function FormField({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--ad-muted)', marginTop: 4 }}>{hint}</div>}
    </label>
  )
}

export function Input({ value, mono, short, placeholder }: { value?: string; mono?: boolean; short?: boolean; placeholder?: string }) {
  const [v, setV] = useState(value || '')
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      placeholder={placeholder}
      style={{ width: short ? 100 : '100%', padding: '10px 12px', border: '1px solid var(--ad-line-strong)', background: '#fff', fontFamily: mono ? 'var(--mono)' : 'var(--sans)', fontSize: 13, color: 'var(--ad-ink)', outline: 'none' }}
    />
  )
}

const SELECT_ARROW =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5d72' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")"

export function Select({ value, options }: { value: string; options: string[] }) {
  const [v, setV] = useState(value)
  return (
    <select
      value={v}
      onChange={(e) => setV(e.target.value)}
      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ad-line-strong)', background: '#fff', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ad-ink)', outline: 'none', appearance: 'none', backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  )
}

export function Textarea({ value }: { value?: string }) {
  const [v, setV] = useState(value || '')
  return (
    <textarea
      value={v}
      onChange={(e) => setV(e.target.value)}
      rows={3}
      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ad-line-strong)', background: '#fff', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ad-ink)', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
    />
  )
}

export function Toggle({ on: defaultOn, label }: { on?: boolean; label: ReactNode }) {
  const [on, setOn] = useState(!!defaultOn)
  return (
    <button onClick={() => setOn(!on)} type="button" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ad-ink)' }}>
      <span style={{ width: 36, height: 20, background: on ? '#3a2552' : '#d4cdc0', position: 'relative', transition: 'background .2s', borderRadius: 10 }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, background: '#fff', transition: 'left .2s', borderRadius: '50%' }} />
      </span>
      {label}
    </button>
  )
}
