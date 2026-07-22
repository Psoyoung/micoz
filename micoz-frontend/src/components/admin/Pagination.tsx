// 관리자 페이지네이션 — 출처: 원본 admin/admin-primitives.jsx Pagination
import type { CSSProperties } from 'react'

const pageBtn: CSSProperties = {
  minWidth: 30,
  padding: '6px 10px',
  fontFamily: 'var(--mono)',
  fontSize: 12,
  background: '#fff',
  border: '1px solid var(--ad-line)',
  color: 'var(--ad-ink)',
  cursor: 'pointer',
}

type Props = {
  page: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

// 현재 페이지 주변으로 최대 5개 페이지 번호 윈도우 계산(1-based).
function pageWindow(page: number, pages: number): number[] {
  if (pages <= 1) return [1]
  const size = Math.min(5, pages)
  let start = Math.max(1, page - 2)
  const end = Math.min(pages, start + size - 1)
  start = Math.max(1, end - size + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function Pagination({ page, total, pageSize, onChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const atFirst = page <= 1
  const atLast = page >= pages
  const disabledBtn: CSSProperties = { opacity: 0.4, cursor: 'default' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid var(--ad-line)', fontSize: 12, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>
      <div>총 {total.toLocaleString()}건 · {page}/{pages} 페이지</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button style={{ ...pageBtn, ...(atFirst ? disabledBtn : {}) }} disabled={atFirst} onClick={() => !atFirst && onChange(page - 1)}>이전</button>
        {pageWindow(page, pages).map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{ ...pageBtn, background: n === page ? '#3a2552' : '#fff', color: n === page ? '#f5f1ea' : 'var(--ad-ink)', borderColor: n === page ? '#3a2552' : 'var(--ad-line)' }}
          >
            {n}
          </button>
        ))}
        <button style={{ ...pageBtn, ...(atLast ? disabledBtn : {}) }} disabled={atLast} onClick={() => !atLast && onChange(page + 1)}>다음</button>
      </div>
    </div>
  )
}
