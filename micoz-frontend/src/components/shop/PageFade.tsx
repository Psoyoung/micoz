// 페이지 전환 페이드 (pageKey 변할 때) — 출처: 원본 shop/primitives.jsx PageFade
import { useState, useEffect, type ReactNode } from 'react'

type Props = {
  pageKey: string
  children: ReactNode
}

export default function PageFade({ pageKey, children }: Props) {
  const [shown, setShown] = useState(pageKey)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if (pageKey !== shown) {
      setVisible(false)
      const t = setTimeout(() => {
        setShown(pageKey)
        setVisible(true)
        window.scrollTo?.({ top: 0 })
      }, 180)
      return () => clearTimeout(t)
    }
  }, [pageKey, shown])
  return (
    <div style={{ opacity: visible ? 1 : 0, transition: 'opacity .25s ease' }}>{children}</div>
  )
}
