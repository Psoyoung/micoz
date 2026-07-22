// 관리자 버튼 — 출처: 원본 admin/admin-primitives.jsx AdminBtn
// 원본 JS hover(variant별 배경)는 CSS .ad-btn--{variant}:hover 로 이관(배경은 인라인에서 제외 → !important 불필요).
import type { CSSProperties, ReactNode } from 'react'

type Variant = 'primary' | 'default' | 'danger' | 'ghost'

const FG: Record<Variant, string> = { primary: '#f5f1ea', default: '#1a1424', danger: '#8a3a2c', ghost: '#1a1424' }
const BD: Record<Variant, string> = { primary: '#3a2552', default: 'var(--ad-line-strong)', danger: '#e6c8c1', ghost: 'transparent' }
const PAD: Record<string, string> = { sm: '6px 12px', md: '9px 16px', lg: '12px 22px' }
const FS: Record<string, number> = { sm: 11.5, md: 12.5, lg: 13 }

type Props = {
  children: ReactNode
  onClick?: () => void
  variant?: Variant
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  style?: CSSProperties
}

export default function AdminBtn({ children, onClick, variant = 'default', icon, size = 'md', style = {} }: Props) {
  return (
    <button
      onClick={onClick}
      className={`ad-btn ad-btn--${variant}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: PAD[size],
        color: FG[variant],
        border: `1px solid ${BD[variant]}`,
        fontFamily: 'var(--sans)',
        fontWeight: 500,
        fontSize: FS[size],
        cursor: 'pointer',
        letterSpacing: '0.02em',
        transition: 'all .15s',
        ...style,
      }}
    >
      {icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </button>
  )
}
