// 쇼핑몰 장바구니 페이지 — 출처: 원본 shop/screens-auth-cart.jsx CartPage
// CartContext(드로어와 동일 상태) 사용. opt→option, qty→quantity, won→lib/format.
import { useNavigate } from 'react-router-dom'
import { won } from '../../lib/format'
import { useCart } from '../../contexts/CartContext'
import { useIsMobile } from '../../lib/useIsMobile'
import MobileCart from './mobile/MobileCart'
import { Icon } from '../../components/shop/icons'
import Counter from '../../components/shop/Counter'
import PrimaryBtn from '../../components/shop/PrimaryBtn'
import ThinLink from '../../components/shop/ThinLink'

// 뷰포트 분기 — 한쪽 트리만 렌더
export default function CartPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileCart /> : <DesktopCart />
}

function DesktopCart() {
  const navigate = useNavigate()
  const { items: cart, updateQty, remove } = useCart()

  const sub = cart.reduce((s, i) => s + i.option.price * i.quantity, 0)
  const ship = sub === 0 ? 0 : sub >= 50000 ? 0 : 3000
  const total = sub + ship

  return (
    <main style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <section style={{ padding: '60px 56px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em' }}>장바구니</h1>
          <p style={{ marginTop: 16, fontSize: 14, color: 'var(--muted)' }}>총 {cart.length}개의 제품 · 5만원 이상 구매 시 무료 배송</p>
        </div>
      </section>

      <section style={{ padding: '40px 56px 120px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 64 }}>
          {/* Cart items */}
          <div>
            {cart.length === 0 ? (
              <div style={{ padding: '120px 40px', textAlign: 'center', background: '#ffffff', border: '1px solid var(--line)' }}>
                <div style={{ marginBottom: 24, opacity: 0.4 }}>{Icon.bag(40, 'var(--muted)')}</div>
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 26, margin: 0, color: 'var(--plum-800)' }}>장바구니가 비어 있어요.</h3>
                <div style={{ height: 32 }} />
                <PrimaryBtn onClick={() => navigate('/products')}>제품 둘러보기 →</PrimaryBtn>
              </div>
            ) : (
              <>
                {/* table header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr 140px 130px 60px',
                    gap: 24,
                    padding: '16px 0',
                    borderBottom: '1px solid var(--line-strong)',
                    fontFamily: 'var(--serif-en)',
                    fontSize: 11,
                    color: 'var(--muted)',
                    letterSpacing: '0.2em',
                  }}
                >
                  <span>PRODUCT</span>
                  <span></span>
                  <span style={{ textAlign: 'center' }}>QTY</span>
                  <span style={{ textAlign: 'right' }}>SUBTOTAL</span>
                  <span></span>
                </div>

                {cart.map((it) => (
                  <div
                    key={it.cartId}
                    style={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px 130px 60px', gap: 24, alignItems: 'center', padding: '28px 0', borderBottom: '1px solid var(--line)' }}
                  >
                    <div style={{ width: 120, height: 150, background: it.product.grad, cursor: 'pointer' }} onClick={() => navigate(`/products/${it.product.id}`)} />
                    <div>
                      <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 6 }}>
                        {(it.product.line ?? '').toUpperCase()}
                      </div>
                      <div
                        style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 400, color: 'var(--plum-800)', cursor: 'pointer' }}
                        onClick={() => navigate(`/products/${it.product.id}`)}
                      >
                        {it.product.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                        {it.option.name} · {won(it.option.price)}
                      </div>
                      <button style={{ marginTop: 12, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--muted)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {Icon.heart(12)} 찜하기
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Counter value={it.quantity} onChange={(v) => updateQty(it.cartId, v)} />
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--serif-en)', fontSize: 18, color: 'var(--plum-800)' }}>{won(it.option.price * it.quantity)}</div>
                    <button onClick={() => remove(it.cartId)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 8, justifySelf: 'end' }}>
                      {Icon.close(16)}
                    </button>
                  </div>
                ))}

                <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                  <ThinLink onClick={() => navigate('/products')}>← 쇼핑 계속하기</ThinLink>
                </div>
              </>
            )}
          </div>

          {/* Summary */}
          <aside style={{ position: 'sticky', top: 100, alignSelf: 'start', background: '#352a50', color: 'var(--cream)', padding: 40 }}>
            <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em', opacity: 0.6, marginBottom: 24 }}>ORDER SUMMARY</div>

            {/* Free shipping progress */}
            {sub > 0 && sub < 50000 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 12 }}>
                  무료 배송까지 <span style={{ fontFamily: 'var(--serif-en)', color: 'var(--plum-200)' }}>{won(50000 - sub)}</span> 남음
                </div>
                <div style={{ height: 2, background: 'rgba(245,241,234,0.18)' }}>
                  <div style={{ width: `${Math.min(100, (sub / 50000) * 100)}%`, height: '100%', background: 'var(--plum-200)', transition: 'width .4s' }} />
                </div>
              </div>
            )}
            {sub >= 50000 && (
              <div style={{ padding: '12px 14px', background: 'rgba(196, 176, 216, 0.12)', border: '1px solid rgba(196, 176, 216, 0.25)', fontSize: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--plum-200)' }}>{Icon.check(12, 'var(--plum-200)')}</span>
                무료 배송이 적용되었어요.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>소계</span>
                <span style={{ fontFamily: 'var(--serif-en)' }}>{won(sub)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>배송비</span>
                <span style={{ fontFamily: 'var(--serif-en)' }}>{ship === 0 ? '— ' : won(ship)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>적립 예정</span>
                <span style={{ fontFamily: 'var(--serif-en)', color: 'var(--plum-200)' }}>+ {won(Math.floor(sub * 0.05))}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '24px 0', marginTop: 24, borderTop: '1px solid rgba(245,241,234,0.18)' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>최종 결제</span>
              <span style={{ fontFamily: 'var(--serif-en)', fontSize: 28 }}>{won(total)}</span>
            </div>

            <PrimaryBtn
              full
              size="lg"
              dark={false}
              onClick={() => cart.length > 0 && navigate('/checkout')}
              style={{ background: 'var(--cream)', color: 'var(--plum-900)', border: 'none' }}
            >
              {cart.length === 0 ? '장바구니 비어있음' : '결제하기'}
            </PrimaryBtn>

            <div style={{ marginTop: 24, fontSize: 11, opacity: 0.5, lineHeight: 1.7, letterSpacing: '0.05em' }}>
              · VISA · Mastercard · 카카오페이 · 네이버페이
              <br />· 모든 결제는 SSL 암호화로 안전하게 보호됩니다.
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
