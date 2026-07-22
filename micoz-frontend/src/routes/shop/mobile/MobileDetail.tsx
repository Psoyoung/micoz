// 모바일 제품 상세 — 출처: 원본 shop/screens-mobile.jsx MobileDetail
// 자체 크롬(MobileHeader dark transparent + onBack). 담기 → cart 반영 + 드로어 오픈(모바일 카트 표면).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from '../../../lib/data'
import { won } from '../../../lib/format'
import { useCart } from '../../../contexts/CartContext'
import MobileHeader from '../../../components/shop/MobileHeader'
import Bottle, { type BottleShape } from '../../../components/shop/Bottle'
import { Icon } from '../../../components/shop/icons'
import OptionPicker from '../../../components/shop/OptionPicker'
import Counter from '../../../components/shop/Counter'
import PrimaryBtn from '../../../components/shop/PrimaryBtn'

export default function MobileDetail({ product }: { product: Product }) {
  const navigate = useNavigate()
  const { items, add, openDrawer } = useCart()
  const [optId, setOptId] = useState(product.options[0].id)
  const [qty, setQty] = useState(1)
  const opt = product.options.find((o) => o.id === optId) ?? product.options[0]
  const shape: BottleShape = product.categoryName === '크림' ? 'jar' : 'tall'

  const handleAdd = () => {
    add(product, opt, qty)
    openDrawer()
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%', paddingBottom: 100 }}>
      <MobileHeader onBack={() => navigate('/products')} cart={items} onCart={openDrawer} dark transparent />
      <div style={{ marginTop: -52, paddingTop: 52, background: product.grad, height: 460, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <Bottle grad={product.grad} h={420} line={product.nameEn} shape={shape} />
      </div>
      <div style={{ padding: '32px 24px' }}>
        <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 12 }}>{(product.line ?? '').toUpperCase()}</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em' }}>{product.name}</h1>
        <div style={{ fontFamily: 'var(--serif-en)', fontStyle: 'italic', fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{product.nameEn}</div>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.8, color: 'var(--ink)', marginTop: 20, fontWeight: 300 }}>{product.shortDesc}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
          <span style={{ fontFamily: 'var(--serif-en)', fontSize: 22, color: 'var(--plum-800)' }}>{won(opt.price)}</span>
          <span style={{ fontSize: 10, padding: '3px 8px', background: 'var(--plum-100)', color: 'var(--plum-700)', letterSpacing: '0.15em' }}>5% 적립</span>
        </div>

        <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 12 }}>OPTION</div>
          <OptionPicker options={product.options} value={optId} onChange={setOptId} />
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Counter value={qty} onChange={setQty} />
          <span style={{ fontFamily: 'var(--serif-en)', fontSize: 22, color: 'var(--plum-800)' }}>{won(opt.price * qty)}</span>
        </div>
      </div>

      {/* sticky add to cart */}
      <div style={{ position: 'sticky', bottom: 0, padding: '16px 24px 32px', background: 'var(--cream)', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
        <button style={{ width: 52, height: 52, background: 'transparent', border: '1px solid var(--plum-700)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--plum-700)' }}>
          {Icon.heart(16)}
        </button>
        <PrimaryBtn full size="lg" onClick={handleAdd}>
          장바구니 담기
        </PrimaryBtn>
      </div>
    </div>
  )
}
