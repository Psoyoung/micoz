// 밑줄형 가는 링크 버튼 — 출처: 원본 shop/primitives.jsx ThinLink
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  onClick?: () => void
  color?: string
  size?: number
}

export default function ThinLink({ children, onClick, color = 'var(--ink)', size = 12 }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        borderBottom: `1px solid ${color}`,
        padding: '4px 0',
        fontSize: size,
        letterSpacing: '0.25em',
        color,
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
        fontWeight: 400,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </button>
  )
}
