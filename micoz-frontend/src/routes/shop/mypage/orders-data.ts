// 마이페이지 주문내역 목업 — 데스크탑 MyPage·모바일 MobileMyPage 공유.
import { PRODUCTS, type Product } from '../../../lib/data'

export type OrderRow = [no: string, date: string, status: string, items: Product[], total: number]

export const ORDERS: OrderRow[] = [
  ['MZ-26050700428', '2026.05.07', '배송 준비', [PRODUCTS[0], PRODUCTS[2]], 336000],
  ['MZ-26041200312', '2026.04.12', '배송 완료', [PRODUCTS[1]], 168000],
  ['MZ-26032800189', '2026.03.28', '배송 완료', [PRODUCTS[3], PRODUCTS[4]], 136000],
]
