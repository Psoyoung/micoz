// 관리자 아이콘 세트 (SVG 직접 구현, 1.4 stroke) — 출처: 원본 admin/admin-primitives.jsx AIcon
// 외부 라이브러리 미사용. currentColor 사용.
import type { ReactNode } from 'react'

export const AIcon: Record<string, (s?: number) => ReactNode> = {
  dash: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM3 21h8v-6H3v6zM13 3v6h8V3h-8z" /></svg>),
  user: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>),
  folder: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 6h6l2 3h10v10H3V6z" /></svg>),
  box: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10" /></svg>),
  cart: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 4h2l2.4 11.4a2 2 0 002 1.6h7.6a2 2 0 002-1.6L21 8H6" /><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /></svg>),
  chart: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>),
  cog: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>),
  chat: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M21 12a8 8 0 01-11.6 7.1L4 21l1.9-5.4A8 8 0 1121 12z" /></svg>),
  search: (s = 16) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>),
  bell: (s = 16) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 004 0" /></svg>),
  arrowUp: (s = 12) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 14l5-5 5 5" /></svg>),
  arrowDn: (s = 12) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 10l5 5 5-5" /></svg>),
  more: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>),
  download: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 4v12M7 11l5 5 5-5M4 20h16" /></svg>),
  plus: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 12h14" /></svg>),
  edit: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 20h4l10-10-4-4L4 16v4z" /></svg>),
  trash: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>),
  filter: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" /></svg>),
  caret: (s = 12) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 9l6 6 6-6" /></svg>),
  chevR: (s = 12) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 6l6 6-6 6" /></svg>),
}
