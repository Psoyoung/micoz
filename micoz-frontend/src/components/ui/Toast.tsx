// 토스트 알림 (shop·admin 공용) — 출처: 원본 shop/primitives.jsx Toast
// ui 독립성을 위해 체크 아이콘 SVG 를 인라인 (원본 Icon.check 와 동일).
import { useEffect } from 'react'

type Props = {
  show: boolean
  message: string
  onClose: () => void
}

export default function Toast({ show, message, onClose }: Props) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 2400)
      return () => clearTimeout(t)
    }
  }, [show, onClose])
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: `translateX(-50%) translateY(${show ? 0 : 16}px)`,
        opacity: show ? 1 : 0,
        transition: 'all .3s ease',
        background: 'var(--plum-700)',
        color: 'var(--cream)',
        padding: '14px 28px',
        fontSize: 13,
        letterSpacing: '0.05em',
        zIndex: 9999,
        pointerEvents: show ? 'auto' : 'none',
        boxShadow: '0 12px 40px rgba(42, 26, 62, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ color: 'var(--plum-200)', display: 'inline-flex' }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 12l5 5L20 7" />
        </svg>
      </span>
      {message}
    </div>
  )
}
