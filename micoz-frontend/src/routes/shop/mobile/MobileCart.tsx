// 모바일 장바구니 — 출처: 원본 shop/screens-mobile.jsx MobileCart
// 자체 크롬(MobileHeader 장바구니 + onBack). CartContext 공유. opt→option, qty→quantity.
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { won } from '../../../lib/format'
import { useCart } from '../../../contexts/CartContext'
import MobileHeader from '../../../components/shop/MobileHeader'
import { Icon } from '../../../components/shop/icons'

const qtyBtnM: CSSProperties = { width: 30, height: 30, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--ink)' }
const qtyValM: CSSProperties = { minWidth: 30, textAlign: 'center', fontFamily: 'var(--serif-en)', fontSize: 13, padding: '0 4px' }

export default function MobileCart() {
  const navigate = useNavigate()
  const { items: cart, updateQty, remove, openDrawer } = useCart()
  const sub = cart.reduce((s, i) => s + i.option.price * i.quantity, 0)
  const ship = sub === 0 ? 0 : sub >= 50000 ? 0 : 3000
  const total = sub + ship
  const earn = Math.floor(sub * 0.05)

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%', paddingBottom: cart.length === 0 ? 80 : 180 }}>
      <MobileHeader title="장바구니" onBack={() => navigate('/')} cart={cart} onCart={openDrawer} />

      {cart.length === 0 ? (
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ marginBottom: 24, opacity: 0.4 }}>{Icon.bag(36, 'var(--muted)')}</div>
          <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 22, margin: 0, color: 'var(--plum-800)' }}>장바구니가 비어 있어요.</h3>
          <button
            onClick={() => navigate('/products')}
            style={{ marginTop: 28, padding: '14px 28px', background: 'var(--plum-700)', color: 'var(--cream)', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, letterSpacing: '0.04em' }}
          >
            제품 둘러보기 →
          </button>
        </div>
      ) : (
        <>
          {/* select all bar */}
          <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', background: '#ffffff', fontSize: 13, color: 'var(--muted)' }}>
            <span>총 {cart.length}개 제품</span>
            <span style={{ fontFamily: 'var(--serif-en)', color: 'var(--plum-700)' }}>전체선택</span>
          </div>

          {/* item list */}
          <div>
            {cart.map((it) => (
              <div key={it.cartId} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#ffffff', display: 'flex', gap: 12 }}>
                <div style={{ width: 76, height: 96, flexShrink: 0, background: it.product.grad }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--plum-800)', fontWeight: 500, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {it.product.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{it.option.name}</div>
                    </div>
                    <button onClick={() => remove(it.cartId)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--muted)', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--line-strong)' }}>
                      <button onClick={() => updateQty(it.cartId, Math.max(1, it.quantity - 1))} style={qtyBtnM}>−</button>
                      <span style={qtyValM}>{it.quantity}</span>
                      <button onClick={() => updateQty(it.cartId, it.quantity + 1)} style={qtyBtnM}>+</button>
                    </div>
                    <div style={{ fontFamily: 'var(--serif-en)', fontSize: 15, color: 'var(--plum-800)' }}>{won(it.option.price * it.quantity)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* summary */}
          <div style={{ padding: '20px 20px 24px', background: '#ffffff', marginTop: 8 }}>
            {sub > 0 && sub < 50000 && (
              <div style={{ padding: '12px 14px', background: 'var(--plum-50)', fontSize: 12, color: 'var(--plum-700)', marginBottom: 16, lineHeight: 1.5 }}>
                {won(50000 - sub)} 더 담으면 <strong>무료 배송</strong>
                <div style={{ marginTop: 8, height: 3, background: 'rgba(58, 37, 82, 0.12)', overflow: 'hidden' }}>
                  <div style={{ width: `${(sub / 50000) * 100}%`, height: '100%', background: 'var(--plum-700)' }} />
                </div>
              </div>
            )}
            {(
              [
                ['소계', won(sub)],
                ['배송비', ship === 0 ? '무료' : won(ship)],
                ['적립 예정', '+ ' + won(earn), 'var(--plum-500)'],
              ] as [string, string, string?][]
            ).map(([k, v, color]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13.5 }}>
                <span style={{ color: 'var(--muted)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--serif-en)', color: color || 'var(--ink)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* sticky checkout */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--cream)', borderTop: '1px solid var(--line)', padding: '14px 20px 28px', zIndex: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>최종 결제</span>
              <span style={{ fontFamily: 'var(--serif-en)', fontSize: 22, color: 'var(--plum-800)' }}>{won(total)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              style={{ width: '100%', padding: '16px 0', background: 'var(--plum-800)', color: 'var(--cream)', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, letterSpacing: '0.05em' }}
            >
              {cart.length}개 상품 결제하기
            </button>
          </div>
        </>
      )}
    </div>
  )
}
