// 수량 카운터 — 출처: 원본 shop/primitives.jsx Counter
import type { CSSProperties } from 'react'

type Props = {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}

const countBtn: CSSProperties = {
  width: 36,
  height: 36,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 16,
  color: 'var(--ink)',
  fontFamily: 'var(--sans)',
}

export default function Counter({ value, onChange, min = 1, max = 99 }: Props) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--line-strong)' }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={countBtn}>
        −
      </button>
      <span
        style={{
          minWidth: 40,
          textAlign: 'center',
          fontFamily: 'var(--serif-en)',
          fontSize: 14,
          padding: '0 4px',
        }}
      >
        {value}
      </span>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={countBtn}>
        +
      </button>
    </div>
  )
}
