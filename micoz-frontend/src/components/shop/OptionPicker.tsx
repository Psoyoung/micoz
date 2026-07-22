// 옵션 선택기 (가로 라인 라디오) — 출처: 원본 shop/primitives.jsx OptionPicker
// props 는 lib/data ProductOption 사용. 원본 o.label → option.name, won 은 lib/format 에서.
import type { ProductOption } from '../../lib/data'
import { won } from '../../lib/format'

type Props = {
  options: ProductOption[]
  value: number
  onChange: (id: number) => void
  color?: string
}

export default function OptionPicker({ options, value, onChange, color = 'var(--plum-700)' }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((o) => {
        const sel = o.id === value
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              background: sel ? 'rgba(42, 26, 62, 0.04)' : 'transparent',
              border: `1px solid ${sel ? color : 'var(--line)'}`,
              cursor: 'pointer',
              transition: 'all .2s',
              fontFamily: 'var(--sans)',
              color: 'var(--ink)',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: sel ? 500 : 400 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: `1.5px solid ${sel ? color : 'var(--line-strong)'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {sel && <span style={{ width: 6, height: 6, background: color, borderRadius: '50%' }} />}
              </span>
              {o.name}
            </span>
            <span style={{ fontFamily: 'var(--serif-en)', fontSize: 14 }}>{won(o.price)}</span>
          </button>
        )
      })}
    </div>
  )
}
