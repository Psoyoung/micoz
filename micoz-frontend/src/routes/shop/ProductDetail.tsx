// 쇼핑몰 제품 상세 — 출처: 원본 shop/screens-desktop.jsx DetailPage
// /products/:id 로 진입 → lib/data 에서 조회. desc→shortDesc, category→categoryName, won→lib/format.
// 라우트 param 이 바뀌어도 옵션/수량 state 가 초기화되도록 DetailView 를 product.id 로 key 처리.
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PRODUCTS, type Product } from '../../lib/data'
import { won } from '../../lib/format'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import Bottle, { type BottleShape } from '../../components/shop/Bottle'
import { Icon } from '../../components/shop/icons'
import OptionPicker from '../../components/shop/OptionPicker'
import Counter from '../../components/shop/Counter'
import PrimaryBtn from '../../components/shop/PrimaryBtn'
import ProductCard from '../../components/shop/ProductCard'
import { useIsMobile } from '../../lib/useIsMobile'
import MobileDetail from './mobile/MobileDetail'

export default function ProductDetail() {
  const { id } = useParams()
  const isMobile = useIsMobile()
  const product = PRODUCTS.find((p) => String(p.id) === id)
  if (!product) return null // 잘못된 id — 목업은 동기이며 정상 흐름엔 없음
  // 한쪽 트리만 렌더. key 로 product 변경 시 state 초기화.
  return isMobile ? <MobileDetail key={product.id} product={product} /> : <DetailView key={product.id} product={product} />
}

function shapeFor(categoryName: string): BottleShape {
  return categoryName === '크림' ? 'jar' : categoryName === '토너' ? 'wide' : 'tall'
}

function DetailView({ product }: { product: Product }) {
  const navigate = useNavigate()
  const { add } = useCart()
  const { show } = useToast()
  const [optId, setOptId] = useState(product.options[0].id)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('detail')
  const opt = product.options.find((o) => o.id === optId) ?? product.options[0]
  const related = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4)

  const handleAdd = () => {
    add(product, opt, qty)
    show(`${product.name}이(가) 장바구니에 담겼습니다.`)
  }

  return (
    <main style={{ background: 'var(--cream)' }}>
      {/* Breadcrumb */}
      <div style={{ padding: '24px 56px', maxWidth: 1440, margin: '0 auto', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.1em' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          HOME
        </span>
        <span style={{ margin: '0 10px', opacity: 0.5 }}>/</span>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/products')}>
          SHOP
        </span>
        <span style={{ margin: '0 10px', opacity: 0.5 }}>/</span>
        <span style={{ color: 'var(--ink)' }}>{product.name}</span>
      </div>

      {/* Detail hero */}
      <section style={{ padding: '20px 56px 80px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 80 }}>
          {/* left — product image */}
          <div>
            <Bottle grad={product.grad} h={720} line={product.nameEn} shape={shapeFor(product.categoryName)} />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    background: [product.grad, 'linear-gradient(155deg, #4d3470, #c4b0d8)', 'linear-gradient(140deg, #2d2347, #6b4d8f)', 'linear-gradient(170deg, #352a50, #9a7fb8)'][i],
                    border: i === 0 ? '1.5px solid var(--plum-700)' : '1.5px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          {/* right — info */}
          <div style={{ paddingTop: 32 }}>
            <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 16 }}>
              {(product.line ?? '').toUpperCase()}
            </div>

            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 56, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>{product.name}</h1>
            <div style={{ fontFamily: 'var(--serif-en)', fontStyle: 'italic', fontSize: 18, color: 'var(--muted)', marginTop: 6, fontWeight: 300, letterSpacing: '0.05em' }}>{product.nameEn}</div>

            <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.9, color: 'var(--ink)', marginTop: 32, fontWeight: 300, marginBottom: 0 }}>{product.shortDesc}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 36 }}>
              <span style={{ fontFamily: 'var(--serif-en)', fontSize: 28, color: 'var(--plum-800)' }}>{won(opt.price)}</span>
              <span style={{ fontSize: 11, padding: '4px 10px', background: 'var(--plum-100)', color: 'var(--plum-700)', letterSpacing: '0.15em' }}>5% 적립</span>
            </div>

            <div style={{ marginTop: 36, paddingTop: 32, borderTop: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 14 }}>OPTION · 용량</div>
              <OptionPicker options={product.options} value={optId} onChange={setOptId} />
            </div>

            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 24 }}>
              <div>
                <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 12 }}>QUANTITY</div>
                <Counter value={qty} onChange={setQty} />
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 12 }}>TOTAL</div>
                <div style={{ fontFamily: 'var(--serif-en)', fontSize: 26, color: 'var(--plum-800)' }}>{won(opt.price * qty)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <PrimaryBtn full size="lg" onClick={handleAdd}>
                장바구니 담기
              </PrimaryBtn>
              <button
                style={{ width: 56, height: 56, background: 'transparent', border: '1px solid var(--plum-700)', cursor: 'pointer', color: 'var(--plum-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {Icon.heart(18)}
              </button>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '36px 0 0', fontSize: 13, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>· 5만원 이상 구매 시 무료배송 (3-5 영업일 내 도착)</li>
              <li>· 미개봉 30일 이내 무료반품</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section style={{ padding: '0 56px 120px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 48, borderBottom: '1px solid var(--line)', marginBottom: 48 }}>
            {[
              ['detail', '상세 설명'],
              ['ingredients', '성분'],
              ['howto', '사용법'],
              ['reviews', '리뷰 (286)'],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  padding: '20px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === k ? '1.5px solid var(--plum-800)' : '1.5px solid transparent',
                  fontFamily: 'var(--sans)',
                  fontSize: 14,
                  fontWeight: tab === k ? 500 : 400,
                  color: tab === k ? 'var(--plum-800)' : 'var(--muted)',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  marginBottom: -1,
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {tab === 'detail' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
              <div style={{ aspectRatio: '4 / 5', background: product.grad }} />
              <div>
                <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 20 }}>SIGNATURE INGREDIENT</div>
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>28일의 발효, 보랏빛 정수</h3>
                <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.9, color: 'var(--muted)', marginTop: 24, fontWeight: 300 }}>
                  자연 발효된 한방 추출물이 피부의 결을 천천히 다듬어줍니다. 깊은 밤 피어나는 보랏빛 꽃잎에서 영감을 얻은 시그니처 컴파운드.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, marginTop: 32, fontSize: 13, color: 'var(--ink)' }}>
                  {['보랏빛 정수 컴파운드', '자연 발효 28일', '한방 7종 추출', '피부 자극 테스트 완료'].map((t) => (
                    <li key={t} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ color: 'var(--plum-500)' }}>{Icon.check(14, 'var(--plum-500)')}</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {tab === 'ingredients' && (
            <div style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 2, color: 'var(--ink)', maxWidth: 800, fontWeight: 300 }}>
              정제수, 부틸렌글라이콜, 글리세린, 보라색 작약 추출물, 자색 고구마 발효 추출물, 한방 복합 추출물(인삼·감초·당귀 등 7종), 나이아신아마이드, 아데노신, 판테놀, 스쿠알란, 토코페롤, 시트르산…
            </div>
          )}
          {tab === 'howto' && (
            <ol style={{ paddingLeft: 0, listStyle: 'none', counterReset: 'step', maxWidth: 720 }}>
              {['클렌징 후 토너로 결을 정돈합니다.', '본 제품 2-3 방울을 손바닥에 덜어 부드럽게 펴 바릅니다.', '얼굴 안쪽에서 바깥쪽으로 천천히 흡수시킵니다.', '아침과 저녁, 하루 두 번 사용을 권장합니다.'].map((t, i) => (
                <li key={i} style={{ padding: '24px 0', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '60px 1fr', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--serif-en)', fontSize: 22, color: 'var(--plum-500)' }}>0{i + 1}</span>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 300, lineHeight: 1.7 }}>{t}</span>
                </li>
              ))}
            </ol>
          )}
          {tab === 'reviews' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {(
                [
                  ['김**', '결이 차분히 정돈되는 느낌이 좋아요. 향도 은은하고 끈적임 없이 깊이 흡수돼요.', 5],
                  ['이**', '발림성이 정말 부드럽고, 다음날 아침 피부가 한결 매끄러워요.', 5],
                  ['박**', '용기 디자인부터 향까지 럭셔리합니다. 선물용으로도 좋아요.', 4],
                  ['최**', '재구매 의사 100%. 가을 겨울 건조함 잡아주는 데 최고.', 5],
                ] as [string, string, number][]
              ).map(([n, t, s], i) => (
                <div key={i} style={{ padding: 28, background: 'var(--paper)', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontFamily: 'var(--serif-en)', fontSize: 13, color: 'var(--plum-700)' }}>
                      {'★'.repeat(s)}
                      {'☆'.repeat(5 - s)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{n} · 2026.04.{20 + i}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.8, color: 'var(--ink)', margin: 0, fontWeight: 300 }}>{t}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Related */}
      <section style={{ padding: '0 56px 120px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 16 }}>YOU MAY ALSO LIKE</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36, margin: 0, marginBottom: 48, color: 'var(--plum-800)' }}>함께 추천하는 제품</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {related.map((p) => (
              <ProductCard key={p.id} p={p} compact onClick={() => navigate(`/products/${p.id}`)} onAdd={() => { add(p, p.options[0]); show(`${p.name}이(가) 장바구니에 담겼습니다.`) }} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
