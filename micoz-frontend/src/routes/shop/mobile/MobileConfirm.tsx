// 모바일 주문 완료 — 출처: 원본 shop/screens-mobile.jsx MobileConfirm
// 원본은 app-live 가 헤더를 줬으나 self-chrome 패턴 유지 위해 MobileHeader(주문완료) 내장.
// 주문번호는 checkout 가 넘긴 Order(router state). 직접 진입 시 폴백 생성.
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { generateOrderNo, type Order } from '../../../lib/data'
import { useCart } from '../../../contexts/CartContext'
import MobileHeader from '../../../components/shop/MobileHeader'

export default function MobileConfirm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { items, openDrawer } = useCart()
  const order = (location.state as { order?: Order } | null)?.order
  const [orderNo] = useState(() => order?.orderNo ?? generateOrderNo())

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%' }}>
      <MobileHeader title="주문완료" onBack={() => navigate('/')} cart={items} onCart={openDrawer} />
      <div style={{ padding: '60px 24px 80px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--plum-700)', color: 'var(--cream)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 12 }}>ORDER CONFIRMED</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 28, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em' }}>주문이 접수되었습니다.</h1>
          <p style={{ marginTop: 18, fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.8 }}>
            주문번호 <span style={{ fontFamily: 'var(--serif-en)', color: 'var(--plum-700)' }}>{orderNo}</span>
            <br />
            정성껏 준비해 보내드릴게요.
          </p>
        </div>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => navigate('/mypage')} style={{ padding: '14px 0', background: 'var(--plum-800)', color: 'var(--cream)', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500 }}>주문 내역 보기</button>
          <button onClick={() => navigate('/')} style={{ padding: '14px 0', background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line-strong)', cursor: 'pointer', fontSize: 13.5 }}>홈으로 돌아가기</button>
        </div>
      </div>
    </div>
  )
}
