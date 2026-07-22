// 관리자 드롭다운 — 출처: 원본 admin/admin-primitives.jsx AdminDropdown
// 옵션 hover 는 CSS .ad-opt 로 이관(배경 인라인 제외). 'all' 값은 placeholder 톤.
import { useState, useRef, useEffect } from 'react'

export type DropdownOption = { k: string; l: string }

type Props = {
  value: string
  onChange: (k: string) => void
  options: DropdownOption[]
  width?: number | string
}

export default function AdminDropdown({ value, onChange, options, width = 180 }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isFluid = typeof width === 'string'

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const current = options.find((o) => o.k === value) || options[0]
  const isAll = current.k === 'all'

  return (
    <div ref={ref} style={{ position: 'relative', display: isFluid ? 'block' : 'inline-block', width: isFluid ? width : undefined }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ width, padding: '6px 10px 6px 12px', background: '#fff', border: `1px solid ${open ? '#3a2552' : 'var(--ad-line-strong)'}`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ad-ink)', textAlign: 'left', minHeight: 30 }}
      >
        <span style={{ flex: 1, color: isAll ? 'var(--ad-muted)' : 'var(--ad-ink)', fontWeight: isAll ? 400 : 500 }}>{current.l}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ad-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .12s' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: isFluid ? '100%' : (width as number) + 20, background: '#fff', border: '1px solid var(--ad-line-strong)', boxShadow: '0 8px 24px rgba(26, 20, 36, 0.10)', zIndex: 50, padding: '4px 0', maxHeight: 320, overflowY: 'auto' }}>
          {options.map((o) => {
            const selected = o.k === value
            return (
              <button
                key={o.k}
                type="button"
                className={`ad-opt${selected ? ' ad-opt--sel' : ''}`}
                onClick={() => {
                  onChange(o.k)
                  setOpen(false)
                }}
                style={{ width: '100%', padding: '8px 12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ad-ink)', textAlign: 'left' }}
              >
                <span style={{ width: 12, display: 'inline-flex', justifyContent: 'center', color: '#3a2552' }}>
                  {selected ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  ) : null}
                </span>
                <span style={{ flex: 1, fontWeight: selected ? 500 : 400 }}>{o.l}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
