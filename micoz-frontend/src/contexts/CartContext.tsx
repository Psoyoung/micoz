// 장바구니 전역 상태 — 출처: 원본 shop/app-live.jsx 의 cart 로직 이식.
// 클라이언트 전용(목업). 드로어 열림 상태도 함께 관리해 헤더·상세에서 제어.
// items 는 localStorage 에 저장/복원해 새로고침에도 유지(추후 dat_cart 서버 동기화로 대체 예정).
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { CartItem, ProductSummary, ProductOption } from '../lib/data'

const STORAGE_KEY = 'micoz.cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CartItem[]) : []
  } catch {
    return []
  }
}

type CartContextValue = {
  items: CartItem[]
  add: (product: ProductSummary, option: ProductOption, qty?: number) => void
  remove: (cartId: string) => void
  updateQty: (cartId: string, qty: number) => void
  clear: () => void
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // items 변경 시 localStorage 동기화
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* 저장 실패(용량/프라이빗 모드 등)는 무시 */
    }
  }, [items])

  const add = useCallback((product: ProductSummary, option: ProductOption, qty: number = 1) => {
    const cartId = `${product.id}-${option.id}`
    setItems((prev) => {
      const exist = prev.find((i) => i.cartId === cartId)
      if (exist) return prev.map((i) => (i.cartId === cartId ? { ...i, quantity: i.quantity + qty } : i))
      return [...prev, { cartId, product, option, quantity: qty }]
    })
  }, [])

  const remove = useCallback((cartId: string) => {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId))
  }, [])

  const updateQty = useCallback((cartId: string, qty: number) => {
    setItems((prev) => prev.map((i) => (i.cartId === cartId ? { ...i, quantity: qty } : i)))
  }, [])

  const clear = useCallback(() => setItems([]), [])
  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, drawerOpen, openDrawer, closeDrawer }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
