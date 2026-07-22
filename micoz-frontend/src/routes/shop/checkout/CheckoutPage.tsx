// 쇼핑몰 주문서 작성 — 출처: 원본 shop/screens-desktop2.jsx CheckoutPage
// CartContext 사용. 제출 시 cart+폼으로 Order 객체를 클라이언트에서 생성(목업) → cart 비우고 /order/complete 로 전달.
// 실제 주문 POST 는 API 단계. 폼/헬퍼는 checkout 폴더에 colocate.
import { useState, type ReactNode, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { won } from '../../../lib/format'
import { useCart } from '../../../contexts/CartContext'
import { useIsMobile } from '../../../lib/useIsMobile'
import MobileCheckout from '../mobile/MobileCheckout'
import { Icon } from '../../../components/shop/icons'
import { buildOrder } from './buildOrder'

const SELECT_ARROW =
  "url(\"data:image/svg+xml,%3Csvg width='12' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b5d72' fill='none' stroke-width='1.4'/%3E%3C/svg%3E\")"

// 뷰포트 분기 — 한쪽 트리만 렌더
export default function CheckoutPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileCheckout /> : <DesktopCheckout />
}

function DesktopCheckout() {
  const navigate = useNavigate()
  const { items: cart, clear } = useCart()
  const [pay, setPay] = useState('credit')
  const [shipMemo, setShipMemo] = useState('default')
  const [point, setPoint] = useState('')
  const [coupon, setCoupon] = useState('')
  const [agreeAll, setAgreeAll] = useState(false)
  const [agree1, setAgree1] = useState(false)
  const [agree2, setAgree2] = useState(false)

  const sub = cart.reduce((s, i) => s + i.option.price * i.quantity, 0)
  const ship = sub >= 50000 ? 0 : 3000
  const discount = cart.length > 0 ? 2500 : 0 // 회원 할인 예시
  const usePoint = Math.min(parseInt(point) || 0, 28400)
  const total = sub + ship - discount - usePoint
  const earn = Math.floor(sub * 0.05)

  const toggleAll = () => {
    const v = !agreeAll
    setAgreeAll(v)
    setAgree1(v)
    setAgree2(v)
  }

  const placeOrder = () => {
    // 공유 buildOrder 로 클라이언트 목업 주문 생성. 실제 발급은 API 단계.
    const order = buildOrder({
      cart,
      pay,
      discount,
      pointUsed: usePoint,
      shipping: {
        recipientName: '박지우',
        recipientPhone: '010-9999-4165',
        zipCode: '06070',
        address: '서울특별시 강남구 청담동 37 (청담동, 헤르츠1번지)',
        addressDetail: '402호',
        shippingMemo: shipMemo !== 'default' ? shipMemo : undefined,
      },
    })
    clear()
    navigate('/order/complete', { state: { order } })
  }

  return (
    <main style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      {/* Page header */}
      <section style={{ padding: '60px 56px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em' }}>주문서 작성</h1>
        </div>
      </section>

      <section style={{ padding: '60px 56px 120px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
          {/* LEFT — form sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* 주문자 정보 */}
            <FormSection title="주문자 정보">
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: 14, columnGap: 24, fontSize: 14, alignItems: 'center' }}>
                <FormLabel>이름</FormLabel>
                <CKInput defaultValue="박지우" />

                <FormLabel>휴대폰</FormLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 12px 1fr 12px 1fr', gap: 6, alignItems: 'center' }}>
                  <CKInput defaultValue="010" />
                  <span style={{ textAlign: 'center', color: 'var(--muted)' }}>-</span>
                  <CKInput defaultValue="9999" />
                  <span style={{ textAlign: 'center', color: 'var(--muted)' }}>-</span>
                  <CKInput defaultValue="4165" />
                </div>

                <FormLabel>이메일</FormLabel>
                <CKInput defaultValue="jiwoo.park@email.net" />
              </div>
            </FormSection>

            {/* 배송지 정보 */}
            <FormSection title="배송지 정보" action="배송지 관리">
              <div style={{ padding: 24, border: '1.5px solid var(--plum-700)', background: 'var(--paper)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ padding: '5px 12px', background: 'var(--plum-700)', color: 'var(--cream)', fontSize: 11, letterSpacing: '0.2em' }}>기본 배송지</span>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: 'var(--plum-800)' }}>박지우</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>· 010-9999-4165</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.7 }}>서울특별시 강남구 청담동 37 (청담동, 헤르츠1번지) 402호</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>우편번호 06070</div>
              </div>
            </FormSection>

            {/* 배송 요청 사항 */}
            <FormSection title="배송 요청 사항">
              <select
                value={shipMemo}
                onChange={(e) => setShipMemo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line-strong)',
                  fontFamily: 'var(--sans)',
                  fontSize: 14,
                  color: 'var(--ink)',
                  outline: 'none',
                  borderRadius: 0,
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: SELECT_ARROW,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 18px center',
                }}
              >
                <option value="default">배송 요청 사항 선택</option>
                <option>문 앞에 놓아주세요</option>
                <option>경비실에 맡겨주세요</option>
                <option>택배함에 넣어주세요</option>
                <option>배송 전 연락 바랍니다</option>
                <option>직접 받겠습니다 (부재 시 재방문)</option>
              </select>
            </FormSection>

            {/* 주문 상품 */}
            <FormSection title={`주문 상품 (${cart.length})`}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 80px 140px 100px',
                  gap: 16,
                  padding: '14px 0',
                  borderBottom: '1px solid var(--line-strong)',
                  fontFamily: 'var(--serif-en)',
                  fontSize: 11,
                  color: 'var(--muted)',
                  letterSpacing: '0.2em',
                }}
              >
                <span>상품 정보</span>
                <span></span>
                <span style={{ textAlign: 'center' }}>수량</span>
                <span style={{ textAlign: 'right' }}>판매 금액</span>
                <span style={{ textAlign: 'right' }}>포인트</span>
              </div>

              {cart.map((it) => {
                const lineTotal = it.option.price * it.quantity
                const before = Math.round(lineTotal * 1.1)
                const pts = Math.floor(lineTotal * 0.05)
                return (
                  <div
                    key={it.cartId}
                    style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 140px 100px', gap: 16, padding: '24px 0', alignItems: 'center', borderBottom: '1px solid var(--line)' }}
                  >
                    <div style={{ width: 100, height: 124, background: it.product.grad }} />
                    <div>
                      <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 6 }}>{(it.product.line ?? '').toUpperCase()}</div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 400, color: 'var(--plum-800)', marginBottom: 4 }}>{it.product.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{it.option.name}</div>
                    </div>
                    <div style={{ textAlign: 'center', fontFamily: 'var(--serif-en)', fontSize: 14, color: 'var(--ink)' }}>{it.quantity}</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'line-through', fontFamily: 'var(--serif-en)' }}>{won(before)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: '#c14b3a', fontFamily: 'var(--serif-en)', fontWeight: 500 }}>10%</span>
                        <span style={{ fontFamily: 'var(--serif-en)', fontSize: 16, color: 'var(--plum-800)', fontWeight: 500 }}>{won(lineTotal)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--serif-en)', fontSize: 13, color: 'var(--plum-500)' }}>{pts} P</div>
                  </div>
                )
              })}
            </FormSection>

            {/* 쿠폰 및 포인트 적용 */}
            <FormSection title="쿠폰 및 포인트 적용">
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: 18, columnGap: 24, alignItems: 'center' }}>
                <FormLabel>쿠폰</FormLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <select
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: 'var(--paper)',
                      border: '1px solid var(--line-strong)',
                      fontFamily: 'var(--sans)',
                      fontSize: 13,
                      color: 'var(--ink)',
                      outline: 'none',
                      borderRadius: 0,
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: SELECT_ARROW,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                    }}
                  >
                    <option value="">쿠폰 선택 (3장 사용 가능)</option>
                    <option>웰컴 ₩ 5,000 할인 쿠폰</option>
                    <option>VIP 5% 할인 쿠폰</option>
                    <option>봄맞이 ₩ 3,000 할인 쿠폰</option>
                  </select>
                </div>

                <FormLabel>포인트</FormLabel>
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        value={point}
                        onChange={(e) => setPoint(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="0"
                        style={{
                          width: '100%',
                          padding: '12px 30px 12px 16px',
                          background: 'var(--paper)',
                          border: '1px solid var(--line-strong)',
                          fontFamily: 'var(--serif-en)',
                          fontSize: 14,
                          color: 'var(--ink)',
                          outline: 'none',
                          borderRadius: 0,
                          textAlign: 'right',
                        }}
                      />
                      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--serif-en)', fontSize: 13, color: 'var(--muted)' }}>P</span>
                    </div>
                    <button
                      onClick={() => setPoint('28400')}
                      style={{ padding: '12px 18px', background: 'transparent', border: '1.5px solid var(--plum-700)', color: 'var(--plum-700)', cursor: 'pointer', fontSize: 12, letterSpacing: '0.18em', whiteSpace: 'nowrap', fontWeight: 500 }}
                    >
                      전액 사용
                    </button>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                    보유 포인트 <span style={{ fontFamily: 'var(--serif-en)', color: 'var(--plum-700)' }}>28,400 P</span>
                    {' · '}최소 사용 1,000P · 최대 사용 가능 28,400P
                  </div>
                </div>
              </div>
            </FormSection>

            {/* 결제 수단 */}
            <FormSection title="결제 수단">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
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
                      style={{
                        padding: '18px 12px',
                        background: sel ? 'var(--plum-700)' : 'var(--paper)',
                        color: sel ? 'var(--cream)' : 'var(--ink)',
                        border: `1px solid ${sel ? 'var(--plum-700)' : 'var(--line-strong)'}`,
                        cursor: 'pointer',
                        fontFamily: 'var(--sans)',
                        fontSize: 13,
                        fontWeight: sel ? 600 : 400,
                        transition: 'all .2s',
                      }}
                    >
                      {l}
                    </button>
                  )
                })}
              </div>

              {pay === 'credit' && (
                <div style={{ marginTop: 20, padding: 24, background: 'var(--paper)', border: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: 14, columnGap: 24, alignItems: 'center' }}>
                  <FormLabel>카드 종류</FormLabel>
                  <select
                    style={{ padding: '12px 16px', background: '#fff', border: '1px solid var(--line-strong)', fontSize: 13, fontFamily: 'var(--sans)', outline: 'none', borderRadius: 0, appearance: 'none', cursor: 'pointer', backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                  >
                    <option>카드 종류를 선택해주세요</option>
                    <option>현대카드</option>
                    <option>신한카드</option>
                    <option>국민카드</option>
                    <option>삼성카드</option>
                    <option>롯데카드</option>
                    <option>BC카드</option>
                  </select>
                  <FormLabel>할부 개월</FormLabel>
                  <select
                    style={{ padding: '12px 16px', background: '#fff', border: '1px solid var(--line-strong)', fontSize: 13, fontFamily: 'var(--sans)', outline: 'none', borderRadius: 0, appearance: 'none', cursor: 'pointer', backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                  >
                    <option>일시불</option>
                    <option>2개월 무이자</option>
                    <option>3개월 무이자</option>
                    <option>6개월 무이자</option>
                    <option>12개월</option>
                  </select>
                </div>
              )}
            </FormSection>

            {/* 안내 */}
            <div style={{ padding: 24, background: 'rgba(245, 237, 247, 0.6)', border: '1px solid var(--line)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.9 }}>
              <div style={{ marginBottom: 10, color: 'var(--plum-800)', fontWeight: 500, fontSize: 13 }}>· 구매 전 꼭 확인해 주세요.</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>주문 완료 후, 자동 발송되는 결제 정보 메일을 꼭 확인해 주세요.</li>
                <li>제품 색상은 디바이스 환경에 따라 실제와 다르게 보일 수 있어요.</li>
                <li>VIP 회원은 매 주문 시 5% 적립이 자동으로 적용됩니다.</li>
                <li>배송 완료 후 30일 이내 미개봉 제품은 무료 반품이 가능해요.</li>
              </ul>
            </div>
          </div>

          {/* RIGHT — sticky summary */}
          <aside style={{ position: 'sticky', top: 100, border: '1.5px solid var(--plum-800)', background: 'var(--paper)' }}>
            <div style={{ padding: '20px 28px', background: '#352a50', color: 'var(--cream)', fontFamily: 'var(--serif-en)', fontSize: 12, letterSpacing: '0.3em' }}>PAYMENT</div>

            <div style={{ padding: 28 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: 'var(--plum-800)', marginBottom: 20 }}>결제 정보</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                <SummaryRow label="주문 금액" value={won(sub)} />
                <SummaryRow label="배송비" value={ship === 0 ? '— ' : `+ ${won(ship)}`} />
                <SummaryRow label="총 할인 금액" value={`- ${won(discount + usePoint)}`} accent />
              </div>

              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--plum-800)', fontWeight: 500 }}>총 결제 예상 금액</span>
                <span style={{ fontFamily: 'var(--serif-en)', fontSize: 28, color: '#c14b3a', fontWeight: 600 }}>{won(total)}</span>
              </div>

              <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(42, 26, 62, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>총 적립 예상 포인트</span>
                <span style={{ fontFamily: 'var(--serif-en)', fontSize: 14, color: 'var(--plum-700)', fontWeight: 500 }}>+ {earn.toLocaleString('ko-KR')} P</span>
              </div>

              {/* 약관 동의 */}
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
                <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 14 }}>TERMS</div>
                <CKCheck checked={agreeAll} onClick={toggleAll} bold>
                  구매 이용약관 동의 <span style={{ color: 'var(--muted)', fontSize: 12 }}>모두 동의</span>
                </CKCheck>
                <div style={{ height: 1, background: 'var(--line)', margin: '12px 0' }} />
                <CKCheck checked={agree1} onClick={() => { setAgree1(!agree1); setAgreeAll(!agree1 && agree2) }}>
                  개인정보 수집 및 이용 동의 <span style={{ color: '#c14b3a' }}>(필수)</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11, textDecoration: 'underline' }}>내용보기</span>
                </CKCheck>
                <CKCheck checked={agree2} onClick={() => { setAgree2(!agree2); setAgreeAll(agree1 && !agree2) }}>
                  개인정보 제3자 제공 동의 <span style={{ color: '#c14b3a' }}>(필수)</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11, textDecoration: 'underline' }}>내용보기</span>
                </CKCheck>
              </div>

              <button
                onClick={placeOrder}
                disabled={!agree1 || !agree2}
                style={{
                  width: '100%',
                  marginTop: 24,
                  padding: '18px 0',
                  background: agree1 && agree2 ? 'var(--plum-800)' : 'var(--line-strong)',
                  color: 'var(--cream)',
                  border: 'none',
                  fontFamily: 'var(--sans)',
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: '0.2em',
                  cursor: agree1 && agree2 ? 'pointer' : 'not-allowed',
                  transition: 'background .2s',
                }}
              >
                결제하기
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

// ─── Checkout helpers (colocate) ──────────────────────────
function FormSection({ title, action, children }: { title: string; action?: string; children: ReactNode }) {
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 16, marginBottom: 24, borderBottom: '2px solid var(--plum-800)' }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 19, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.005em' }}>{title}</h3>
        {action && (
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#c14b3a', textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: 'var(--sans)' }}>
            {action} ›
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

function FormLabel({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{children}</span>
}

function CKInput({ defaultValue, placeholder }: { defaultValue?: string; placeholder?: string }) {
  return (
    <input
      className="ck-input"
      defaultValue={defaultValue}
      placeholder={placeholder}
      style={{ width: '100%', padding: '12px 16px', background: 'var(--paper)', border: '1px solid var(--line-strong)', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', outline: 'none', borderRadius: 0 }}
    />
  )
}

function CKCheck({ children, checked, onClick, bold }: { children: ReactNode; checked: boolean; onClick: () => void; bold?: boolean }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer', fontSize: bold ? 14 : 13, color: 'var(--ink)', fontWeight: bold ? 600 : 400 }}>
      <span
        style={{
          width: 18,
          height: 18,
          flex: '0 0 18px',
          background: checked ? 'var(--plum-700)' : 'transparent',
          border: `1.5px solid ${checked ? 'var(--plum-700)' : 'var(--line-strong)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && Icon.check(11, 'var(--cream)')}
      </span>
      {children}
    </div>
  )
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--serif-en)', color: accent ? '#c14b3a' : 'var(--ink)', fontWeight: accent ? 500 : 400 } as CSSProperties}>{value}</span>
    </div>
  )
}
