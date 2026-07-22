// 마이페이지 · 내 리뷰 — 출처: 원본 shop/screens-desktop2.jsx ReviewsTab
// 제품 비주얼은 lib/data PRODUCTS, 리뷰 목업은 화면 colocate.
import { PRODUCTS, type Product } from '../../../lib/data'
import { mypageGhostBtn } from './mypage-ui'

type Review = { id: string; product: Product; rating: number; date: string; title: string; body: string }

const REVIEWS: Review[] = [
  { id: 'R-04122', product: PRODUCTS[0], rating: 5, date: '2026.05.04', title: '진심 인생 에센스예요', body: '한 달 가까이 사용했는데 결이 정돈되는 느낌이 확실해요. 묵직한 향이 좋고, 발림성도 우아합니다.' },
  { id: 'R-04018', product: PRODUCTS[1], rating: 4, date: '2026.04.18', title: '안정감 있는 세럼', body: '예민한 피부에도 자극 없이 잘 맞았어요. 다만 캡 부분이 살짝 헐거운 느낌이 있어요.' },
  { id: 'R-03285', product: PRODUCTS[3], rating: 5, date: '2026.03.28', title: '아침 루틴 필수템', body: '토너로 시작하는 게 의식 같아졌어요. 향과 질감 모두 미코즈답습니다.' },
  { id: 'R-03108', product: PRODUCTS[4], rating: 5, date: '2026.03.10', title: '클렌저인데 향이 너무 좋아요', body: '밤 루틴 시작이 즐거워졌어요. 다음번엔 리필도 같이 주문할 예정입니다.' },
]

export default function ReviewsTab() {
  return (
    <div>
      <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: '0 0 32px', color: 'var(--plum-800)' }}>내 리뷰</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {REVIEWS.map((r) => (
          <article key={r.id} style={{ display: 'grid', gridTemplateColumns: '78px 1fr', gap: 22, padding: 24, background: 'var(--paper)', border: '1px solid var(--line)' }}>
            <div style={{ width: 78, height: 100, background: r.product.grad, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--plum-800)' }}>{r.product.name}</div>
                <div style={{ fontFamily: 'var(--serif-en)', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.04em' }}>{r.date} · {r.id}</div>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--plum-500)', letterSpacing: '0.1em' }}>
                {'★'.repeat(r.rating)}
                <span style={{ opacity: 0.2 }}>{'★'.repeat(5 - r.rating)}</span>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 15, marginTop: 12, color: 'var(--ink)', fontWeight: 500 }}>{r.title}</div>
              <p style={{ margin: '8px 0 14px', fontSize: 13.5, lineHeight: 1.7, color: 'var(--muted)' }}>{r.body}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={mypageGhostBtn}>수정</button>
                <button style={mypageGhostBtn}>삭제</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
