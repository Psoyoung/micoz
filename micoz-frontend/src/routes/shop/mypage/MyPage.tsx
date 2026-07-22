// 마이페이지 — 출처: 원본 shop/screens-desktop2.jsx MyPage
// 인증 없음 → 현재 사용자(CURRENT_USER) + lib/data 목업. 탭 전환은 내부 state.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PRODUCTS } from '../../../lib/data'
import { won } from '../../../lib/format'
import { useIsMobile } from '../../../lib/useIsMobile'
import { useAuth } from '../../../auth/AuthContext'
import MobileMyPage from '../mobile/MobileMyPage'
import ProductCard from '../../../components/shop/ProductCard'
import ReturnsTab from './ReturnsTab'
import ReviewsTab from './ReviewsTab'
import AddressTab from './AddressTab'
import ProfileTab from './ProfileTab'
import SupportTab from './SupportTab'
import { ORDERS } from './orders-data'

const NAV: [key: string, label: string, count: number | null][] = [
  ['orders', '주문 내역', 12],
  ['returns', '취소 · 교환 · 반품', 2],
  ['wishlist', '찜한 제품', 8],
  ['reviews', '내 리뷰', 4],
  ['address', '배송지 관리', null],
  ['profile', '회원 정보', null],
  ['support', '1:1 문의', null],
]

// 뷰포트 분기 — 한쪽 트리만 렌더
export default function MyPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileMyPage /> : <DesktopMyPage />
}

function DesktopMyPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('orders')

  return (
    <main style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <section style={{ padding: '80px 56px 120px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 60 }}>
          <aside>
            <div style={{ marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid var(--line-strong)' }}>
              <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10.5, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 10 }}>MY PAGE</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, color: 'var(--plum-800)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>마이페이지</div>
              {user && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10 }}>{user.name} 님 환영합니다</div>}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {NAV.map(([k, l, c]) => (
                <li key={k}>
                  <button
                    onClick={() => setTab(k)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '14px 0',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--line)',
                      fontFamily: 'var(--sans)',
                      fontSize: 14,
                      color: tab === k ? 'var(--plum-800)' : 'var(--muted)',
                      fontWeight: tab === k ? 500 : 400,
                    }}
                  >
                    <span>{l}</span>
                    {c !== null && <span style={{ fontFamily: 'var(--serif-en)', fontSize: 12, opacity: 0.7 }}>{c}</span>}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => void logout()}
              style={{ marginTop: 20, padding: '12px 0', width: '100%', background: 'transparent', border: '1px solid var(--line-strong)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.06em' }}
            >
              로그아웃
            </button>
          </aside>

          <div>
            {tab === 'orders' && (
              <div>
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: '0 0 32px', color: 'var(--plum-800)' }}>주문 내역</h3>
                {ORDERS.map(([no, d, st, items, total]) => (
                  <div key={no} style={{ border: '1px solid var(--line)', marginBottom: 16, background: '#ffffff' }}>
                    <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontFamily: 'var(--serif-en)', fontSize: 14, color: 'var(--plum-700)' }}>{no}</span>
                        <span style={{ marginLeft: 14, fontSize: 12, color: 'var(--muted)' }}>{d}</span>
                      </div>
                      <span style={{ fontSize: 11, padding: '4px 12px', background: st === '배송 준비' ? 'var(--plum-100)' : 'transparent', border: st === '배송 준비' ? 'none' : '1px solid var(--line-strong)', color: st === '배송 준비' ? 'var(--plum-700)' : 'var(--muted)', letterSpacing: '0.1em' }}>{st}</span>
                    </div>
                    <div style={{ padding: 28 }}>
                      {items.map((p, j) => (
                        <div key={j} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 16, alignItems: 'center', padding: '8px 0' }}>
                          <div style={{ width: 60, height: 76, background: p.grad }} />
                          <div>
                            <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--plum-800)' }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{p.options[0].name} · 1개</div>
                          </div>
                          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 14 }}>{won(p.basePrice)}</div>
                        </div>
                      ))}
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--muted)' }}>총 {items.length}개 상품</span>
                        <span style={{ fontFamily: 'var(--serif-en)', fontSize: 18, color: 'var(--plum-800)' }}>{won(total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'wishlist' && (
              <div>
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: '0 0 32px', color: 'var(--plum-800)' }}>찜한 제품</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
                  {PRODUCTS.slice(0, 6).map((p) => (
                    <ProductCard key={p.id} p={p} compact onClick={() => navigate(`/products/${p.id}`)} />
                  ))}
                </div>
              </div>
            )}

            {tab === 'returns' && <ReturnsTab />}
            {tab === 'reviews' && <ReviewsTab />}
            {tab === 'address' && <AddressTab />}
            {tab === 'profile' && <ProfileTab />}
            {tab === 'support' && <SupportTab />}
          </div>
        </div>
      </section>
    </main>
  )
}
