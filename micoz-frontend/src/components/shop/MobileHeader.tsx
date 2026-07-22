// 모바일 헤더 — 출처: 원본 shop/screens-mobile.jsx MobileHeader
// cart props 는 lib/data CartItem 사용 (i.qty → i.quantity).
import type { ReactNode } from 'react'
import type { CartItem } from '../../lib/data'
import MicozLogo from './MicozLogo'
import { Icon } from './icons'

type Props = {
  title?: ReactNode
  onBack?: () => void
  onMenu?: () => void
  transparent?: boolean
  dark?: boolean
  cart?: CartItem[]
  onCart?: () => void
}

export default function MobileHeader({ title, onBack, onMenu, transparent, dark, cart, onCart }: Props) {
  const fg = dark ? 'var(--cream)' : 'var(--ink)'
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 52,
        padding: '0 16px',
        background: transparent ? 'transparent' : dark ? 'rgba(34, 22, 56, 0.92)' : 'rgba(245, 241, 234, 0.92)',
        backdropFilter: 'blur(20px)',
        display: 'grid',
        gridTemplateColumns: '40px 1fr 80px',
        alignItems: 'center',
        borderBottom: transparent ? 'none' : `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'var(--line)'}`,
      }}
    >
      {onBack ? (
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: fg, cursor: 'pointer', padding: 6, marginLeft: -6 }}>
          {Icon.back(20, fg)}
        </button>
      ) : onMenu ? (
        <button onClick={onMenu} style={{ background: 'transparent', border: 'none', color: fg, cursor: 'pointer', padding: 6, marginLeft: -6 }}>
          {Icon.menu(20, fg)}
        </button>
      ) : (
        <div />
      )}
      <div style={{ textAlign: 'center', color: fg }}>{typeof title === 'string' ? <MicozLogo size={16} color={fg} /> : title}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
        <span style={{ color: fg, display: 'inline-flex' }}>{Icon.search(18, fg)}</span>
        <button onClick={onCart} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, position: 'relative', color: fg }}>
          {Icon.bag(18, fg)}
          {cart && cart.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -6,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'var(--plum-700)',
                color: 'var(--cream)',
                fontSize: 9,
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
      </div>
    </div>
  )
}
