// 모바일 홈 — 출처: 원본 shop/screens-mobile.jsx MobileHome
// 자체 크롬(MobileHeader dark transparent + MobileTabBar) 보유. lib/data + CartContext 공유.
import { useNavigate } from 'react-router-dom'
import { COLLECTIONS, PRODUCTS } from '../../../lib/data'
import { useCart } from '../../../contexts/CartContext'
import MobileHeader from '../../../components/shop/MobileHeader'
import MobileTabBar from '../../../components/shop/MobileTabBar'
import Bottle from '../../../components/shop/Bottle'
import ThinLink from '../../../components/shop/ThinLink'
import ProductCard from '../../../components/shop/ProductCard'

const TAB_PATH: Record<string, string> = { home: '/', products: '/products', mypage: '/mypage', cart: '/cart' }

export default function MobileHome() {
  const navigate = useNavigate()
  const { items, openDrawer } = useCart()
  const c = COLLECTIONS[0]

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <MobileHeader cart={items} onCart={openDrawer} dark transparent />
      {/* Hero */}
      <section style={{ marginTop: -52, paddingTop: 52, height: 560, background: c.grad, position: 'relative', overflow: 'hidden', color: 'var(--cream)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 30%, rgba(196, 176, 216, 0.18), transparent 60%)' }} />
        <div style={{ position: 'relative', padding: '32px 24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em', opacity: 0.7 }}>NEW · 2026</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 56, margin: '20px 0 0', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {c.title}
              <br />
              <em style={{ fontFamily: 'var(--serif-en)', fontWeight: 200, opacity: 0.7 }}>{c.sub}</em>
            </h1>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.7, opacity: 0.85, marginTop: 18, fontWeight: 300, maxWidth: 240 }}>{c.desc}</p>
          </div>
          <div style={{ position: 'absolute', right: 0, bottom: 0, width: 220, height: 360 }}>
            <Bottle grad={c.grad} h={360} line={c.sub} />
          </div>
          <div>
            <ThinLink color="var(--cream)">컬렉션 보기 →</ThinLink>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 20 }}>PHILOSOPHY</div>
        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 28, margin: 0, lineHeight: 1.4, color: 'var(--plum-800)' }}>
          가장 깊은 보랏빛 안에
          <br />
          가장 조용한 회복.
        </h2>
      </section>

      {/* Collections */}
      <section style={{ padding: '0 24px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 8 }}>SIGNATURE</div>
            <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 26, margin: 0, color: 'var(--plum-800)' }}>세 가지 컬렉션</h3>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {COLLECTIONS.map((col, i) => (
            <div
              key={col.id}
              onClick={() => navigate('/products')}
              style={{ height: 180, background: col.grad, position: 'relative', cursor: 'pointer', padding: 24, color: 'var(--cream)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, transparent 50%, rgba(20,12,30,0.4))' }} />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', opacity: 0.7 }}>0{i + 1}</span>
                <span style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', opacity: 0.7 }}>{col.sub}</span>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 300 }}>{col.title}</div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{col.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Best */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 8 }}>BESTSELLERS</div>
          <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 26, margin: 0, color: 'var(--plum-800)' }}>가장 사랑받는</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, rowGap: 32 }}>
          {PRODUCTS.slice(0, 4).map((p) => (
            <ProductCard key={p.id} p={p} compact onClick={() => navigate(`/products/${p.id}`)} />
          ))}
        </div>
      </section>

      <MobileTabBar page="home" onNav={(p) => navigate(TAB_PATH[p] ?? '/')} />
    </div>
  )
}
