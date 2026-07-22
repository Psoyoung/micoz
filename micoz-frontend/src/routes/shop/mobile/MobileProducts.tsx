// 모바일 제품 목록 — 출처: 원본 shop/screens-mobile.jsx MobileProducts
// 카테고리 칩은 시각 선택만(원본도 필터 없음). lib/data + CartContext 공유.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PRODUCTS, STOREFRONT_CATEGORIES } from '../../../lib/data'
import { useCart } from '../../../contexts/CartContext'
import MobileHeader from '../../../components/shop/MobileHeader'
import MobileTabBar from '../../../components/shop/MobileTabBar'
import ProductCard from '../../../components/shop/ProductCard'

const TAB_PATH: Record<string, string> = { home: '/', products: '/products', mypage: '/mypage', cart: '/cart' }

export default function MobileProducts() {
  const navigate = useNavigate()
  const { items, openDrawer } = useCart()
  const [cat, setCat] = useState('all')

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%' }}>
      <MobileHeader cart={items} onCart={openDrawer} />
      <section style={{ padding: '24px 24px 0' }}>
        <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 8 }}>SHOP · ALL</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.02em' }}>제품 전체</h1>
      </section>
      <div style={{ overflowX: 'auto', padding: '24px 24px 12px', display: 'flex', gap: 8, scrollbarWidth: 'none' }}>
        {STOREFRONT_CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCat(c.slug)}
            style={{
              padding: '8px 16px',
              whiteSpace: 'nowrap',
              background: cat === c.slug ? 'var(--plum-700)' : 'transparent',
              color: cat === c.slug ? 'var(--cream)' : 'var(--ink)',
              border: `1px solid ${cat === c.slug ? 'var(--plum-700)' : 'var(--line-strong)'}`,
              fontSize: 12,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, rowGap: 32, padding: '16px 24px 100px' }}>
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} p={p} compact onClick={() => navigate(`/products/${p.id}`)} />
        ))}
      </div>
      <MobileTabBar page="products" onNav={(p) => navigate(TAB_PATH[p] ?? '/')} />
    </div>
  )
}
