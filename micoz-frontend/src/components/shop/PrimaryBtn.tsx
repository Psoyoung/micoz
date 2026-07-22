// 기본 버튼 — 출처: 원본 shop/primitives.jsx PrimaryBtn
// 원본의 JS hover(onMouseEnter/Leave)는 규칙에 따라 className + CSS :hover 로 이관 (components.css).
import type { CSSProperties, ReactNode } from 'react'

type Props = {
  children: ReactNode
  onClick?: () => void
  full?: boolean
  dark?: boolean
  size?: 'sm' | 'md' | 'lg'
  style?: CSSProperties
  disabled?: boolean
}

const SIZES = {
  sm: { p: '10px 18px', fs: 12 },
  md: { p: '14px 28px', fs: 13 },
  lg: { p: '18px 36px', fs: 14 },
}

export default function PrimaryBtn({ children, onClick, full, dark = true, size = 'md', style = {}, disabled = false }: Props) {
  const s = SIZES[size]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`micoz-btn ${dark ? 'micoz-btn--dark' : 'micoz-btn--outline'}`}
      style={{
        width: full ? '100%' : 'auto',
        padding: s.p,
        background: dark ? 'var(--plum-700)' : 'transparent',
        color: dark ? 'var(--cream)' : 'var(--plum-700)',
        border: dark ? 'none' : '1px solid var(--plum-700)',
        fontSize: s.fs,
        fontFamily: 'var(--sans)',
        fontWeight: 500,
        letterSpacing: '0.18em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all .25s',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
