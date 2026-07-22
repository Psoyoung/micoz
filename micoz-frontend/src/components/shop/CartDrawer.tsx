// 장바구니 드로어 (우측 슬라이드) — 출처: 원본 shop/screens-desktop2.jsx CartDrawer
// cart props 는 lib/data CartItem 사용 (it.opt.price→it.option.price, it.opt.label→it.option.name, it.qty→it.quantity).
import { useRef, useEffect } from 'react'
import type { CartItem } from '../../lib/data'
import { won } from '../../lib/format'
import { Icon } from './icons'
import Counter from './Counter'
import PrimaryBtn from './PrimaryBtn'

type Props = {
  open: boolean
  cart: CartItem[]
  onClose: () => void
  onUpdateQty: (cartId: string, v: number) => void
  onRemove: (cartId: string) => void
  onCheckout: () => void
}

export default function CartDrawer({ open, cart, onClose, onUpdateQty, onRemove, onCheckout }: Props) {
  const sub = cart.reduce((s, i) => s + i.option.price * i.quantity, 0)
  const ship = sub === 0 ? 0 : sub >= 50000 ? 0 : 3000
  const total = sub + ship

  // 닫힘 시 inert 로 패널을 탭 순서·포인터·접근성 트리에서 제외(화면 밖 transform 만으로는 부족).
  // inert 는 요소를 렌더 유지하므로 슬라이드 애니메이션은 보존된다.
  const asideRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = asideRef.current
    if (!el) return
    if (open) el.removeAttribute('inert')
    else el.setAttribute('inert', '')
  }, [open])

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(20,12,30,0.4)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .3s',
          zIndex: 200,
          backdropFilter: 'blur(4px)',
        }}
      />
      <aside
        ref={asideRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          maxWidth: '100vw',
          background: 'var(--cream)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .4s cubic-bezier(.2,.7,.3,1)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(20,12,30,0.15)',
        }}
      >
        <div
          style={{
            padding: '32px 36px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', color: 'var(--plum-500)' }}>YOUR BAG</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 28, margin: '8px 0 0', color: 'var(--plum-800)', letterSpacing: '-0.01em' }}>
              장바구니 ({cart.length})
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink)', padding: 8 }}>
            {Icon.close(20)}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 36px' }}>
          {cart.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center', fontFamily: 'var(--serif)', color: 'var(--muted)', fontSize: 16, fontWeight: 300 }}>
              <div style={{ marginBottom: 18, opacity: 0.5 }}>{Icon.bag(36, 'var(--muted)')}</div>
              장바구니가 비어 있어요.
            </div>
          ) : (
            cart.map((it) => (
              <div
                key={it.cartId}
                style={{ display: 'grid', gridTemplateColumns: '88px 1fr auto', gap: 20, padding: '24px 0', borderBottom: '1px solid var(--line)' }}
              >
                <div style={{ width: 88, height: 110, background: it.product.grad }} />
                <div>
                  <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 6 }}>
                    {(it.product.line ?? '').toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 400, color: 'var(--plum-800)' }}>{it.product.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{it.option.name}</div>
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Counter value={it.quantity} onChange={(v) => onUpdateQty(it.cartId, v)} />
                    <button
                      onClick={() => onRemove(it.cartId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                        color: 'var(--muted)',
                        textDecoration: 'underline',
                        textUnderlineOffset: 3,
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--serif-en)', fontSize: 15, color: 'var(--plum-800)', whiteSpace: 'nowrap' }}>
                  {won(it.option.price * it.quantity)}
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: '24px 36px 36px', borderTop: '1px solid var(--line)', background: 'var(--paper)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
              <span style={{ color: 'var(--muted)' }}>소계</span>
              <span style={{ fontFamily: 'var(--serif-en)' }}>{won(sub)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 16 }}>
              <span style={{ color: 'var(--muted)' }}>
                배송비 {sub >= 50000 && <span style={{ color: 'var(--plum-500)', marginLeft: 6 }}>· 무료</span>}
              </span>
              <span style={{ fontFamily: 'var(--serif-en)' }}>{ship === 0 ? '— ' : won(ship)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '20px 0', borderTop: '1px solid var(--line)' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--plum-800)' }}>합계</span>
              <span style={{ fontFamily: 'var(--serif-en)', fontSize: 24, color: 'var(--plum-800)' }}>{won(total)}</span>
            </div>
            <PrimaryBtn full size="lg" onClick={onCheckout}>
              결제하기
            </PrimaryBtn>
          </div>
        )}
      </aside>
    </>
  )
}
