// MICOZ 데이터 레이어 배럴 — 타입·enum·(잔여) shop 시드 데이터 단일 진입점.
// A5 정리: 관리자 도메인 mock(CATEGORY_TREE·ADMIN_PRODUCTS·ORDERS·RETURNS·SALES_30D·TOP_PRODUCTS_30D·
//   ADMIN_USER·GRADE_TIERS)은 실 API 연동으로 제거. 스키마 스캐폴딩 타입(types.ts)은 보존.
//   MEMBERS·generateOrderNo 는 shop 이 아직 사용 → 유지.
export * from './enums'
export * from './types'

// shop 시드 데이터
export { PRODUCTS, STOREFRONT_CATEGORIES, COLLECTIONS } from './products'
export { MEMBERS } from './members'
export { generateOrderNo } from './orders'
