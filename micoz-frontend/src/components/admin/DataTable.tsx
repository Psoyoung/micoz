// 관리자 데이터 테이블 — 출처: 원본 admin/admin-primitives.jsx DataTable
// 제네릭 행 타입(AdminProductRow/OrderListRow/Member 등). 행 hover 는 CSS .ad-row 로 이관(배경 인라인 제외).
import { useState, type CSSProperties, type ReactNode } from 'react'
import { AIcon } from './icons'

export type Column<T> = {
  key: keyof T & string
  label: ReactNode
  align?: 'left' | 'right' | 'center'
  w?: number
  mono?: boolean
  muted?: boolean
  nowrap?: boolean
  render?: (value: unknown, row: T) => ReactNode
}

type Props<T> = {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  onRowEdit?: (row: T) => void
  rowKey: keyof T
}

const thStyle: CSSProperties = { padding: '12px 14px', textAlign: 'left', fontWeight: 500, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ad-muted)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }
const tdStyle: CSSProperties = { padding: '14px 14px', color: 'var(--ad-ink)', verticalAlign: 'middle' }
const rowAction: CSSProperties = { width: 28, height: 28, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ad-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
const rowEditBtn: CSSProperties = { padding: '5px 12px', background: '#fff', border: '1px solid var(--ad-line-strong)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ad-ink)', letterSpacing: '0.02em' }

export default function DataTable<T>({ columns, rows, onRowClick, onRowEdit, rowKey }: Props<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const keyOf = (r: T) => String(r[rowKey])
  const allSel = selected.size === rows.length && rows.length > 0
  const toggleAll = () => {
    if (allSel) setSelected(new Set())
    else setSelected(new Set(rows.map(keyOf)))
  }
  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  return (
    <div style={{ overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: 'var(--sans)' }}>
        <thead>
          <tr style={{ background: 'var(--ad-paper-2)', borderBottom: '1px solid var(--ad-line)' }}>
            <th style={{ ...thStyle, width: 40, paddingLeft: 22 }}>
              <input type="checkbox" checked={allSel} onChange={toggleAll} />
            </th>
            {columns.map((c, i) => (
              <th key={i} style={{ ...thStyle, textAlign: c.align || 'left', width: c.w }}>{c.label}</th>
            ))}
            <th style={{ ...thStyle, width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const id = keyOf(r)
            const sel = selected.has(id)
            return (
              <tr
                key={id || ri}
                className={`ad-row${sel ? ' ad-row--sel' : ''}`}
                onClick={() => onRowClick?.(r)}
                style={{ borderBottom: '1px solid var(--ad-line-soft)', cursor: onRowClick ? 'pointer' : 'default' }}
              >
                <td style={{ ...tdStyle, paddingLeft: 22 }} onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={sel} onChange={() => toggle(id)} />
                </td>
                {columns.map((c, i) => (
                  <td
                    key={i}
                    style={{ ...tdStyle, textAlign: c.align || 'left', fontFamily: c.mono ? 'var(--mono)' : 'var(--sans)', fontSize: c.mono ? 12 : 12.5, color: c.muted ? 'var(--ad-muted)' : 'var(--ad-ink)', whiteSpace: c.nowrap ? 'nowrap' : 'normal' }}
                  >
                    {c.render ? c.render(r[c.key], r) : (r[c.key] as ReactNode)}
                  </td>
                ))}
                <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                  {onRowEdit ? (
                    <button type="button" onClick={() => onRowEdit(r)} style={rowEditBtn}>수정</button>
                  ) : (
                    <button style={rowAction}>{AIcon.more(14)}</button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
