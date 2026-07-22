// MICOZ 아이콘 세트 (SVG 직접 구현) — 출처: 원본 shop/primitives.jsx Icon
// 외부 아이콘 라이브러리 미사용.

export const Icon = {
  search: (s: number = 16, c: string = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  bag: (s: number = 16, c: string = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </svg>
  ),
  user: (s: number = 16, c: string = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  ),
  heart: (s: number = 16, c: string = 'currentColor', filled: boolean = false) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? c : 'none'} stroke={c} strokeWidth="1.4">
      <path d="M12 21s-7-4.5-9.5-9A5 5 0 0112 6a5 5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  ),
  arrow: (s: number = 14, c: string = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  plus: (s: number = 14, c: string = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  close: (s: number = 16, c: string = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  menu: (s: number = 16, c: string = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  check: (s: number = 14, c: string = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6">
      <path d="M5 12l5 5L20 7" />
    </svg>
  ),
  back: (s: number = 18, c: string = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
}
