// 데스크탑 헤더/네비 + 언어 스위처 — 출처: 원본 shop/screens-desktop.jsx DesktopHeader/LangSwitcher
// cart props 는 lib/data CartItem 사용 (i.qty → i.quantity).
// LangSwitcher 드롭다운 항목의 JS hover 는 CSS .lang-item:hover 로 이관 (components.css).
import { useState, useRef, useEffect } from 'react'
import type { CartItem } from '../../lib/data'
import { useAuth } from '../../auth/AuthContext'
import MicozLogo from './MicozLogo'
import { Icon } from './icons'

type Props = {
  page: string
  cart: CartItem[]
  onNav: (page: string) => void
  onOpenCart: () => void
  dark?: boolean
}

const NAV_ITEMS = [
  { id: 'home', label: '홈' },
  { id: 'products', label: '제품' },
  { id: 'story', label: '브랜드' },
  { id: 'mypage', label: '마이페이지' },
]

export default function DesktopHeader({ page, cart, onNav, onOpenCart, dark = false }: Props) {
  const fg = dark ? 'var(--cream)' : 'var(--ink)'
  const { isAuthenticated } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!searchOpen) return
    setTimeout(() => searchRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen])

  const isProductsActive = (id: string) =>
    page === id || (id === 'products' && (page === 'products' || page === 'detail'))

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: dark ? 'var(--plum-800)' : 'var(--cream)',
        borderBottom: `1px solid ${dark ? 'rgba(245,241,234,0.10)' : 'var(--line)'}`,
        transition: 'background .35s',
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '0 56px',
          height: 80,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
        }}
      >
        <nav style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {NAV_ITEMS.map((it) => {
            const active = isProductsActive(it.id)
            return (
              <button
                key={it.id}
                onClick={() => onNav(it.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  fontSize: 13,
                  fontWeight: 400,
                  letterSpacing: '0.05em',
                  color: fg,
                  padding: '4px 0',
                  opacity: active ? 1 : 0.7,
                  borderBottom: active ? `1px solid ${fg}` : '1px solid transparent',
                  transition: 'opacity .2s',
                }}
              >
                {it.label}
              </button>
            )
          })}
        </nav>

        <button
          onClick={() => onNav('home')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <MicozLogo size={26} color={fg} />
        </button>

        <div style={{ display: 'flex', gap: 22, alignItems: 'center', justifyContent: 'flex-end', color: fg }}>
          {/* Inline search field — slides in from the right of the search icon */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              width: searchOpen ? 180 : 18,
              overflow: 'hidden',
              transition: 'width .25s ease',
              borderBottom: searchOpen ? `1px solid ${fg}` : '1px solid transparent',
              paddingBottom: searchOpen ? 4 : 0,
            }}
          >
            {searchOpen && (
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) setSearchOpen(false)
                }}
                placeholder="검색어를 입력해주세요."
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--sans)',
                  fontSize: 13,
                  color: fg,
                  padding: 0,
                }}
              />
            )}
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: fg,
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
              title="검색"
            >
              {Icon.search(18, fg)}
            </button>
          </div>
          <span style={{ cursor: 'pointer', display: 'inline-flex' }} onClick={() => onNav(isAuthenticated ? 'mypage' : 'login')} title={isAuthenticated ? '마이페이지' : '로그인'}>
            {Icon.user(18, fg)}
          </span>
          <button
            onClick={onOpenCart}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              padding: 4,
              color: fg,
            }}
          >
            {Icon.bag(18, fg)}
            {cart.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: dark ? 'var(--cream)' : 'var(--plum-700)',
                  color: dark ? 'var(--plum-700)' : 'var(--cream)',
                  fontSize: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--serif-en)',
                }}
              >
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
          <LangSwitcher dark={dark} fg={fg} />
        </div>
      </div>
    </header>
  )
}

const LANG_OPTIONS = [
  { k: 'ko', l: '한국어' },
  { k: 'en', l: 'English' },
  { k: 'ja', l: '日本語' },
  { k: 'zh', l: '中文' },
]

function LangSwitcher({ dark, fg }: { dark: boolean; fg: string }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('ko')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const current = LANG_OPTIONS.find((o) => o.k === value) || LANG_OPTIONS[0]

  return (
    <div
      ref={ref}
      style={{ position: 'relative', paddingLeft: 16, borderLeft: `1px solid ${dark ? 'rgba(245,241,234,0.18)' : 'var(--line)'}` }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: fg,
          fontFamily: 'var(--sans)',
          fontSize: 12,
          letterSpacing: '0.05em',
          opacity: 0.85,
        }}
      >
        <span>{current.l}</span>
        <svg
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 14px)',
            right: 0,
            minWidth: 140,
            background: 'var(--cream)',
            color: 'var(--ink)',
            border: '1px solid var(--line)',
            boxShadow: '0 10px 30px rgba(20, 12, 30, 0.10)',
            padding: '6px 0',
            zIndex: 200,
            fontFamily: 'var(--sans)',
          }}
        >
          {LANG_OPTIONS.map((o) => {
            const selected = o.k === value
            return (
              <button
                key={o.k}
                type="button"
                className="lang-item"
                onClick={() => {
                  setValue(o.k)
                  setOpen(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: selected ? 'var(--plum-700)' : 'var(--ink)',
                  fontWeight: selected ? 500 : 400,
                  textAlign: 'left',
                  letterSpacing: '0.01em',
                }}
              >
                {o.l}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
