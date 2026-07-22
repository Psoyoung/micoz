// 모달 공통 동작 — Esc 닫기 + body 스크롤 잠금. shop/admin 공용.
// open=false 이면 아무 것도 하지 않음(항상 마운트되는 모달이 닫힌 동안 스크롤을 잠그지 않도록).
import { useEffect } from 'react'

export function useModalDismiss(onClose: () => void, open: boolean = true) {
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
  }, [onClose, open])
}
