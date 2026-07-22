// 모바일 주문서 — 출처: 원본 shop/screens-mobile.jsx MobileCheckout/MSection
// 자체 크롬(MobileHeader 주문서 + onBack). 주문생성은 공유 buildOrder 재사용. CartContext 공유.
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { won } from '../../../lib/format'
import { useCart } from '../../../contexts/CartContext'
import MobileHeader from '../../../components/shop/MobileHeader'
import { Icon } from '../../../components/shop/icons'
import { buildOrder } from '../checkout/buildOrder'

export default function MobileCheckout() {
  const navigate = useNavigate()
  const { items: cart, clear } = useCart()
  const [pay, setPay] = useState('credit')
  const [agree, setAgree] = useState(false)
  const sub = cart.reduce((s, i) => s + i.option.price * i.quantity, 0)
  const ship = sub === 0 ? 0 : sub >= 50000 ? 0 : 3000
  const total = sub + ship

  const placeOrder = () => {
    const order = buildOrder({
      cart,
      pay,
      shipping: {
        recipientName: '김미코',
        recipientPhone: '010-1234-5678',
        zipCode: '04781',
        address: '서울특별시 성동구 성수이로 89',
        addressDetail: '미코즈빌딩 4층 (성수동2가)',
      },
    })
    clear()
    navigate('/order/complete', { state: { order } })
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%', paddingBottom: 180 }}>
      <MobileHeader title="주문서" onBack={() => navigate('/cart')} cart={cart} onCart={() => navigate('/cart')} />

      {/* 배송지 */}
      <MSection title="배송지 정보">
        <div style={{ padding: 16, background: '#ffffff', border: '1.5px solid var(--plum-700)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>김미코 · 010-1234-5678</span>
            <span style={{ padding: '3px 10px', background: 'var(--plum-700)', color: 'var(--cream)', fontSize: 10, letterSpacing: '0.18em' }}>기본</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            서울특별시 성동구 성수이로 89,
            <br />
            미코즈빌딩 4층 (성수동2가)
          </div>
          <button style={{ marginTop: 12, padding: '8px 14px', background: 'transparent', border: '1px solid var(--line-strong)', cursor: 'pointer', fontSize: 12, color: 'var(--ink)' }}>배송지 변경</button>
        </div>
        <select
          defaultValue="default"
          style={{ width: '100%', marginTop: 10, padding: '12px 14px', background: '#ffffff', border: '1px solid var(--line-strong)', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', outline: 'none', borderRadius: 0 }}
        >
          <option value="default">배송 시 요청사항을 선택하세요</option>
          <option value="absent">부재 시 경비실 보관</option>
          <option value="door">문 앞에 놓아주세요</option>
          <option value="direct">직접 받겠습니다</option>
        </select>
      </MSection>

      {/* 주문 상품 */}
      <MSection title={`주문 상품 (${cart.length})`}>
        <div style={{ background: '#ffffff' }}>
          {cart.map((it, i) => (
            <div key={it.cartId} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: i < cart.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ width: 60, height: 74, background: it.product.grad, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--plum-800)', fontWeight: 500, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {it.product.name}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{it.option.name} · {it.quantity}개</div>
                <div style={{ marginTop: 6, fontFamily: 'var(--serif-en)', fontSize: 14, color: 'var(--ink)' }}>{won(it.option.price * it.quantity)}</div>
              </div>
            </div>
          ))}
        </div>
      </MSection>

      {/* 결제 수단 */}
      <MSection title="결제 수단">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {(
            [
              ['credit', '신용카드 결제'],
              ['vbank', '무통장 입금'],
            ] as [string, string][]
          ).map(([k, l]) => {
            const sel = pay === k
            return (
              <button
                key={k}
                onClick={() => setPay(k)}
                style={{ padding: '14px 8px', background: sel ? 'var(--plum-700)' : '#ffffff', color: sel ? 'var(--cream)' : 'var(--ink)', border: `1px solid ${sel ? 'var(--plum-700)' : 'var(--line-strong)'}`, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
              >
                {l}
              </button>
            )
          })}
        </div>
      </MSection>

      {/* 결제 금액 */}
      <MSection title="결제 금액">
        <div style={{ background: '#ffffff', padding: '16px 18px' }}>
          {(
            [
              ['상품 금액', won(sub)],
              ['배송비', ship === 0 ? '무료' : won(ship)],
            ] as [string, string][]
          ).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13.5 }}>
              <span style={{ color: 'var(--muted)' }}>{k}</span>
              <span style={{ fontFamily: 'var(--serif-en)' }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>최종 결제</span>
            <span style={{ fontFamily: 'var(--serif-en)', fontSize: 22, color: 'var(--plum-800)' }}>{won(total)}</span>
          </div>
        </div>
      </MSection>

      {/* 약관 동의 */}
      <div style={{ padding: '16px 20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>
          <span
            style={{ width: 18, height: 18, background: agree ? 'var(--plum-700)' : 'transparent', border: `1.5px solid ${agree ? 'var(--plum-700)' : 'var(--line-strong)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setAgree(!agree)}
          >
            {agree && Icon.check(12, 'var(--cream)')}
          </span>
          개인정보 수집 · 이용 및 결제 진행에 동의합니다.
        </label>
      </div>

      {/* sticky pay button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--cream)', borderTop: '1px solid var(--line)', padding: '14px 20px 28px', zIndex: 30 }}>
        <button
          onClick={agree ? placeOrder : undefined}
          style={{ width: '100%', padding: '16px 0', background: agree ? 'var(--plum-800)' : 'var(--line-strong)', color: 'var(--cream)', border: 'none', cursor: agree ? 'pointer' : 'not-allowed', fontFamily: 'var(--sans)', fontSize: 14.5, fontWeight: 500, letterSpacing: '0.04em' }}
        >
          {won(total)} 결제하기
        </button>
      </div>
    </div>
  )
}

function MSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ padding: '12px 20px 4px' }}>
      <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ marginBottom: 16 }}>{children}</div>
    </div>
  )
}
