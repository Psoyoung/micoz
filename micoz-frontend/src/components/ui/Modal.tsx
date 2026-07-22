// 모달 (shop·admin 공용 오버레이 primitive)
// 원본 화면별 모달들이 공통으로 쓰던 패턴(백드롭 + 중앙 패널 + Esc 닫기 + body 스크롤 잠금 + modalIn 페이드)을
// 하나의 재사용 컴포넌트로 추출. @keyframes modalIn 은 global.css 에 정의되어 있음.
// 화면 전용 모달은 이 primitive 위에 내용을 얹어 이식 단계에서 구성한다.
import { useEffect, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  children: ReactNode
  width?: number
  title?: ReactNode
}

export default function Modal({ open, onClose, children, width = 480, title }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(20, 12, 30, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'modalIn .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--cream)',
          boxShadow: '0 24px 80px rgba(20, 12, 30, 0.28)',
        }}
      >
        {title !== undefined && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 28px',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, color: 'var(--plum-800)' }}>
              {title}
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink)', padding: 4, display: 'inline-flex' }}
              title="닫기"
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
