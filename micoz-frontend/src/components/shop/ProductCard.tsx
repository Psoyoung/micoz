// 제품 카드 — 출처: 원본 shop/primitives.jsx ProductCard
// props 는 lib/data ProductSummary 사용 (category→categoryName, badge→labels[0], price→basePrice).
// 원본의 React hover state 는 규칙에 따라 CSS group-hover(.pcard:hover …)로 이관 (components.css).
import type { ProductSummary } from '../../lib/data'
import { won } from '../../lib/format'
import Bottle, { type BottleShape } from './Bottle'
import { Icon } from './icons'

type Props = {
  p: ProductSummary
  onClick?: () => void
  onAdd?: (p: ProductSummary) => void
  dark?: boolean
  compact?: boolean
}

export default function ProductCard({ p, onClick, onAdd, dark = false, compact = false }: Props) {
  const ph = compact ? 280 : 380
  const shape: BottleShape = p.categoryName === '크림' ? 'jar' : p.categoryName === '토너' ? 'wide' : 'tall'
  const badge = p.labels[0]

  return (
    <div className="pcard" onClick={onClick} style={{ cursor: 'pointer', background: 'transparent', position: 'relative' }}>
      <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 18 }}>
        <div className="pcard__media">
          <Bottle grad={p.grad} accent={p.accent} h={ph} line={p.nameEn} shape={shape} />
        </div>
        {badge && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              padding: '5px 10px',
              background: 'rgba(245, 241, 234, 0.92)',
              color: 'var(--plum-700)',
              fontSize: 10,
              letterSpacing: '0.2em',
              fontWeight: 500,
            }}
          >
            {badge}
          </div>
        )}
        {onAdd && (
          <button
            className="pcard__add"
            onClick={(e) => {
              e.stopPropagation()
              onAdd(p)
            }}
            style={{
              position: 'absolute',
              right: 14,
              bottom: 14,
              width: 40,
              height: 40,
              background: 'rgba(245, 241, 234, 0.95)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--plum-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="장바구니에 담기"
          >
            {Icon.plus(14)}
          </button>
        )}
      </div>
      <div style={{ color: dark ? 'var(--cream)' : 'var(--ink)' }}>
        <div
          style={{
            fontFamily: 'var(--serif-en)',
            fontSize: 11,
            letterSpacing: '0.3em',
            color: dark ? 'rgba(245,241,234,0.55)' : 'var(--muted)',
            marginBottom: 8,
            textTransform: 'uppercase',
          }}
        >
          {p.line}
        </div>
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontSize: compact ? 17 : 19,
            fontWeight: 400,
            marginBottom: 8,
            letterSpacing: '-0.01em',
          }}
        >
          {p.name}
        </div>
        <div style={{ fontFamily: 'var(--serif-en)', fontSize: 14, color: dark ? 'rgba(245,241,234,0.85)' : 'var(--ink)' }}>
          {won(p.basePrice)}
        </div>
      </div>
    </div>
  )
}
