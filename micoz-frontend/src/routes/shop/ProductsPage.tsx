// 쇼핑몰 제품 목록 — 출처: 원본 shop/screens-desktop.jsx ProductsPage
// 데이터: lib/data PRODUCTS·STOREFRONT_CATEGORIES (category→categoryName, count→productCount, id→slug, price→basePrice).
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PRODUCTS, STOREFRONT_CATEGORIES, type Product } from '../../lib/data'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import { useIsMobile } from '../../lib/useIsMobile'
import MobileProducts from './mobile/MobileProducts'
import ProductCard from '../../components/shop/ProductCard'

const CAT_MAP: Record<string, string> = {
  essence: '에센스',
  serum: '세럼',
  cream: '크림',
  toner: '토너',
  mask: '마스크',
  cleanser: '클렌징',
}

// 뷰포트 분기 — 한쪽 트리만 렌더
export default function ProductsPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileProducts /> : <DesktopProducts />
}

function DesktopProducts() {
  const navigate = useNavigate()
  const { add } = useCart()
  const { show } = useToast()
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState('featured')

  const filtered = useMemo(() => {
    let arr = [...PRODUCTS]
    if (cat !== 'all') {
      arr = arr.filter(
        (p) =>
          p.categoryName === CAT_MAP[cat] ||
          (cat === 'mask' && (p.categoryName === '마스크' || p.categoryName === '미스트' || p.categoryName === '아이케어')),
      )
    }
    if (sort === 'price-asc') arr.sort((a, b) => a.basePrice - b.basePrice)
    if (sort === 'price-desc') arr.sort((a, b) => b.basePrice - a.basePrice)
    if (sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    return arr
  }, [cat, sort])

  const handleAdd = (p: Product) => {
    add(p, p.options[0])
    show(`${p.name}이(가) 장바구니에 담겼습니다.`)
  }

  return (
    <main style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      {/* Page header */}
      <section style={{ padding: '56px 56px 32px', background: 'linear-gradient(180deg, #f5edf7 0%, var(--cream) 100%)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 22, letterSpacing: '0.32em', color: 'var(--plum-700)', fontWeight: 500 }}>SHOP · PRODUCT</div>
        </div>
      </section>

      <section style={{ padding: '40px 56px 120px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 64 }}>
          {/* Sidebar */}
          <aside>
            <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
              CATEGORY
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {STOREFRONT_CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <button
                    onClick={() => setCat(c.slug)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 0',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--sans)',
                      fontSize: 14,
                      color: cat === c.slug ? 'var(--plum-800)' : 'var(--muted)',
                      fontWeight: cat === c.slug ? 500 : 400,
                    }}
                  >
                    <span>{c.name}</span>
                    <span style={{ fontFamily: 'var(--serif-en)', fontSize: 12, opacity: 0.6 }}>({c.productCount})</span>
                  </button>
                </li>
              ))}
            </ul>

            <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em', color: 'var(--muted)', marginTop: 48, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
              CONCERN
            </div>
            {['수분', '결 정돈', '탄력', '진정', '광채'].map((t) => (
              <button key={t} style={{ display: 'block', padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--muted)', fontWeight: 300 }}>
                {t}
              </button>
            ))}
          </aside>

          <div>
            {/* Sort row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36, paddingBottom: 20, borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{filtered.length}개 제품</div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{ background: 'transparent', border: 'none', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', cursor: 'pointer', letterSpacing: '0.05em', outline: 'none' }}
              >
                <option value="featured">추천순</option>
                <option value="price-asc">가격 낮은순</option>
                <option value="price-desc">가격 높은순</option>
                <option value="name">이름순</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, rowGap: 64 }}>
              {filtered.map((p) => (
                <ProductCard key={p.id} p={p} onClick={() => navigate(`/products/${p.id}`)} onAdd={() => handleAdd(p)} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
