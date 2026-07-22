// 모바일 하단 탭바 — 출처: 원본 shop/screens-mobile.jsx MobileTabBar
// cart props 는 lib/data CartItem 사용 (i.qty → i.quantity).
import type { ReactNode } from 'react'
import type { CartItem } from '../../lib/data'
import { Icon } from './icons'

type Props = {
  page: string
  onNav: (page: string) => void
  cart?: CartItem[]
}

type IconFn = (s?: number, c?: string) => ReactNode

const TABS: [string, string, IconFn][] = [
  ['home', '홈', Icon.search],
  ['products', '제품', Icon.bag],
  ['mypage', '마이', Icon.user],
  ['cart', '장바구니', Icon.heart],
]

export default function MobileTabBar({ page, onNav, cart = [] }: Props) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        background: 'rgba(245, 241, 234, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--line)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '8px 0 24px',
      }}
    >
      {TABS.map(([id, l, ic]) => {
        const active = page === id || (id === 'products' && page === 'detail')
        const isCart = id === 'cart'
        const count = isCart ? cart.reduce((s, i) => s + i.quantity, 0) : 0
        return (
          <button
            key={id}
            onClick={() => onNav(id)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: 6,
              color: active ? 'var(--plum-800)' : 'var(--muted)',
              position: 'relative',
            }}
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              {ic(20, active ? 'var(--plum-800)' : 'var(--muted)')}
              {isCart && count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'var(--plum-700)',
                    color: 'var(--cream)',
                    fontSize: 9,
                    fontFamily: 'var(--serif-en)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {count}
                </span>
              )}
            </span>
            <span style={{ fontSize: 10, letterSpacing: '0.05em' }}>{l}</span>
          </button>
        )
      })}
    </div>
  )
}
