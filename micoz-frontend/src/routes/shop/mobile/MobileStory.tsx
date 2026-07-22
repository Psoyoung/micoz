// 모바일 브랜드 스토리 — 출처: 원본 shop/screens-mobile.jsx MobileStory
// 자체 크롬(MobileHeader 브랜드 + onBack). 원본 <image-slot> 자리는 /image/brand1.png 로 대체.
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../contexts/CartContext'
import MobileHeader from '../../../components/shop/MobileHeader'
import MobileTabBar from '../../../components/shop/MobileTabBar'

const TAB_PATH: Record<string, string> = { home: '/', products: '/products', mypage: '/mypage', cart: '/cart' }

const FEATURES = [
  { t: ['Trusted Company', 'For Everyone'], d: ['도덕성과 정직함을 바탕으로 연구개발을 진행해', '신뢰받는 기업으로 도약합니다.'], g: 'linear-gradient(155deg, #e8d8f0 0%, #c4b0d8 40%, #9a7fb8 80%, #6b4d8f 100%)' },
  { t: ['Flexible Development', 'Workforce'], d: ['인재들의 잠재력을 이끌어내어 성장을 극대화하여', '사회발전에 기여합니다.'], g: 'linear-gradient(165deg, #f5f1ea 0%, #e8dfd2 35%, #d0c3b0 70%, #b09c80 100%)' },
  { t: ['Fostering', 'Workforce'], d: ['유연한 연구개발을 진행하여', '새로운 가치를 창출하고 시도합니다.'], g: 'linear-gradient(155deg, #f5e6c0 0%, #e8c878 35%, #c89a3c 70%, #8a6420 100%)' },
]

export default function MobileStory() {
  const navigate = useNavigate()
  const { items, openDrawer } = useCart()

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%', paddingBottom: 80 }}>
      <MobileHeader title="브랜드" onBack={() => navigate('/')} cart={items} onCart={openDrawer} />

      {/* About */}
      <section style={{ padding: '32px 24px 40px' }}>
        <img src="/image/brand1.png" alt="대표 이미지" style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', marginBottom: 28 }} />
        <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.32em', color: 'var(--plum-500)', marginBottom: 14, fontStyle: 'italic' }}>About micoz</div>
        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 22, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.005em', lineHeight: 1.45 }}>
          미코즈(주)의 기술력으로
          <br />
          건강하고 아름다운 미래를 만들어 갑니다.
        </h2>
        <p style={{ marginTop: 18, fontFamily: 'var(--serif)', fontSize: 13.5, lineHeight: 1.95, color: 'var(--muted)', fontWeight: 300 }}>
          미코즈㈜는 헬스와 뷰티 디바이스, 화장품 전문회사로 인간의 노화에서는 세포와 피부의 재생을 효과적으로 해결해 최고 아름답게 만들어드리는 제조, 유통, 콘텐츠가 합쳐진 플랫폼 기반의 글로벌 회사입니다.
        </p>
      </section>

      {/* CEO greeting */}
      <section style={{ background: '#352a50', color: 'var(--cream)', padding: '48px 24px' }}>
        <h2 style={{ fontFamily: 'var(--serif-en)', fontWeight: 500, fontSize: 28, margin: 0, letterSpacing: '-0.01em' }}>More Healthy Life</h2>
        <p style={{ marginTop: 22, fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.95, color: 'rgba(245,237,247,0.78)', fontWeight: 300 }}>
          안녕하세요 미코즈㈜ 김정희회장입니다.
          <br />
          항상 미코즈에 깊은 관심과 사랑으로 성원해 주시는 분들께 진심으로 감사드립니다. 저희는 성장을 발판으로 책임감있는 경영과 윤리적인 경영을 실천하기 위해 항상 일정 서고 있으며, 뷰티 업계 26년의 경력과 경험으로 모두가 추구하는 가치를 이루어가기 위해 노력하고 있습니다.
        </p>
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'baseline', gap: 12, fontFamily: 'var(--serif)', fontSize: 12, color: 'var(--plum-200)' }}>
          <span>미코즈㈜ 회장</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 300, color: 'var(--cream)', fontStyle: 'italic' }}>김정희</span>
        </div>
      </section>

      {/* Vision band */}
      <section style={{ padding: '40px 24px', textAlign: 'center', background: 'linear-gradient(180deg, #f8f3ec 0%, #ede5d8 50%, #f5edf7 100%)' }}>
        <h2 style={{ fontFamily: 'var(--serif-en)', fontWeight: 500, fontSize: 22, margin: 0, color: 'var(--plum-800)' }}>
          Company Philosophy
          <br />
          &amp; Vision
        </h2>
        <p style={{ marginTop: 18, fontFamily: 'var(--serif)', fontSize: 13.5, lineHeight: 2, color: 'var(--muted)', fontWeight: 300 }}>
          미코즈는 성장을 발판으로 책임감있는 경영과 윤리적인 경영을 실천하기위해 경영이념을 세기며 실천해 나아가고있습니다.
        </p>
      </section>

      {/* Trusted / Flexible / Fostering */}
      {FEATURES.map((s, i) => (
        <section key={i}>
          <div style={{ width: '100%', aspectRatio: '4 / 3', background: s.g }} />
          <div style={{ padding: '36px 24px 8px', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--serif-en)', fontWeight: 500, fontSize: 24, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.005em', lineHeight: 1.2 }}>
              {s.t[0]}
              <br />
              {s.t[1]}
            </h3>
            <p style={{ marginTop: 18, fontFamily: 'var(--serif)', fontSize: 13.5, lineHeight: 1.95, color: 'var(--muted)', fontWeight: 300 }}>
              {s.d[0]}
              <br />
              {s.d[1]}
            </p>
          </div>
        </section>
      ))}

      <MobileTabBar page="story" onNav={(p) => navigate(TAB_PATH[p] ?? '/')} />
    </div>
  )
}
