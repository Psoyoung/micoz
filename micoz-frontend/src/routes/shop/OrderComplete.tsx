// 쇼핑몰 주문 완료 — 출처: 원본 shop/screens-desktop2.jsx OrderConfirm
// checkout 에서 생성한 Order 를 router state 로 받아 주문번호 표시. 직접 진입 시 폴백 생성.
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { generateOrderNo, type Order } from '../../lib/data'
import { useIsMobile } from '../../lib/useIsMobile'
import MobileConfirm from './mobile/MobileConfirm'
import { Icon } from '../../components/shop/icons'
import PrimaryBtn from '../../components/shop/PrimaryBtn'

// 뷰포트 분기 — 한쪽 트리만 렌더
export default function OrderComplete() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileConfirm /> : <DesktopOrderComplete />
}

function DesktopOrderComplete() {
  const navigate = useNavigate()
  const location = useLocation()
  const order = (location.state as { order?: Order } | null)?.order
  const [orderNo] = useState(() => order?.orderNo ?? generateOrderNo())

  return (
    <main style={{ background: 'var(--cream)', minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 56px' }}>
      <div style={{ maxWidth: 540, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--plum-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          {Icon.check(28, 'var(--plum-700)')}
        </div>
        <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 14 }}>ORDER COMPLETED</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 44, color: 'var(--plum-800)', margin: 0, letterSpacing: '-0.01em' }}>주문이 완료되었어요.</h1>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.9, color: 'var(--muted)', marginTop: 24, fontWeight: 300 }}>
          주문번호 <span style={{ fontFamily: 'var(--serif-en)', color: 'var(--plum-700)' }}>{orderNo}</span>
          <br />
          소중한 의식이 시작되는 순간까지, 정성껏 준비해 보내드릴게요.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40 }}>
          <PrimaryBtn dark={false} onClick={() => navigate('/mypage')}>주문 내역 보기</PrimaryBtn>
          <PrimaryBtn onClick={() => navigate('/')}>쇼핑 계속하기</PrimaryBtn>
        </div>
      </div>
    </main>
  )
}
