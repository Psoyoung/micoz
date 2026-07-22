// 마운트 시 페이드인 래퍼 — 출처: 원본 shop/primitives.jsx FadeIn
import { useState, useEffect, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  delay?: number
  y?: number
}

export default function FadeIn({ children, delay = 0, y = 12 }: Props) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'translateY(0)' : `translateY(${y}px)`,
        transition: 'opacity .8s ease, transform .8s ease',
      }}
    >
      {children}
    </div>
  )
}
