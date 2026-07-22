// 관리자 주문 도메인 — 출처: docs/admin_api.md §O (O-1 목록 · O-2 상세 · O-3~O-7 상태전이).
// [members.ts 패턴 따름] DTO(명세 그대로) → 매퍼 → 뷰모델 → React Query 훅.
// A3b: 상태전이(§3.1 주문 / §3.2 배송). 성공 시 data 없음 → 상세 재조회로 갱신(admin_api.md 명시).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageResponse } from '../types'
import { adminGet, adminPatch } from './client'
import { adminOrderStatusLabel, adminShippingStatusLabel, adminPaymentStatusLabel } from './labels'
import { fmtDateTime, won, toNum } from './format'

/* ─── DTO (명세 그대로) ─── */

// O-1 AdminOrderListItem
export interface AdminOrderListItemDto {
  orderSeq: number
  orderNo: string
  orderStatus: string // §2.1
  userSeq: number
  orderDate: string // OffsetDateTime
  finalAmount: number // BigDecimal
  firstItemName: string | null
  totalItemCount: number
}

// O-2 items[] OrderItemSnapshot
export interface OrderItemSnapshotDto {
  itemSeq: number
  productSeq: number
  optionSeq: number | null
  productCode: string
  productName: string
  optionName: string
  unitPrice: number // BigDecimal
  quantity: number
  itemAmount: number // BigDecimal
  mainImageUrl: string | null // 라이브 조인, 소프트삭제 상품은 null
}

// O-2 shipping OrderShippingInfo
export interface OrderShippingInfoDto {
  recipientName: string
  recipientPhone: string
  zipCode: string
  address: string
  addressDetail: string
  shippingMemo: string
  trackingNo: string | null
  shippingStatus: string // §2.2
  shippedDate: string | null
  deliveredDate: string | null
}

// O-2 payment OrderPaymentInfo
export interface OrderPaymentInfoDto {
  paymentType: string
  paymentStatus: string // §2.7
  paidAmount: number // BigDecimal
  cardCompany: string
  cardNoMasked: string
  installment: number
  approvalNo: string
  paidDate: string | null
}

// O-2 AdminOrderDetailResponse
export interface AdminOrderDetailDto {
  orderSeq: number
  orderNo: string
  userSeq: number
  orderStatus: string
  orderDate: string
  itemsTotal: number // BigDecimal
  totalDiscount: number // BigDecimal
  couponDiscount: number // BigDecimal
  pointUsed: number
  shippingFee: number // BigDecimal
  finalAmount: number // BigDecimal
  pointToEarn: number
  items: OrderItemSnapshotDto[]
  shipping: OrderShippingInfoDto | null
  payment: OrderPaymentInfoDto | null
}

// O-1 검색 파라미터(전부 선택) + 페이징
export interface OrderSearchParams {
  q?: string // orderNo 부분일치
  orderStatus?: string
  userSeq?: number
  dateFrom?: string // ISO datetime
  dateTo?: string // ISO datetime
  page?: number // 0-based
  size?: number
  sort?: string // 화이트리스트: orderDate·orderSeq·finalAmount
}

/* ─── 뷰모델 ───
   매퍼 갭: O-1 목록은 userSeq 만 제공 — 고객명(customerName)·결제수단·배송상태는 목록에 없음(백엔드 빚).
   기존 mock 컬럼(고객/결제수단/배송상태)은 목록에서 제거, userSeq 표시로 대체. 결제수단·배송상태는 상세(O-2)에서 확인.
   firstItemName + totalItemCount 로 "대표상품 외 N건" 파생 표시. */
export interface AdminOrderRow {
  orderSeq: number
  orderNo: string
  orderStatus: string
  statusLabel: string
  userSeq: number
  orderDate: string // 'YYYY-MM-DD HH:mm'
  finalAmount: number
  finalAmountLabel: string
  totalItemCount: number
  itemSummary: string // "대표상품명 외 N건" | "대표상품명" | '-'
}

export interface AdminOrderItemRow {
  itemSeq: number
  productSeq: number
  optionSeq: number | null
  productCode: string
  productName: string
  optionName: string
  unitPrice: number
  unitPriceLabel: string
  quantity: number
  itemAmount: number
  itemAmountLabel: string
  mainImageUrl: string | null
}

export interface AdminOrderShippingView {
  recipientName: string
  recipientPhone: string
  zipCode: string
  address: string
  addressDetail: string
  shippingMemo: string
  trackingNo: string
  shippingStatus: string
  shippingStatusLabel: string
  shippedDate: string
  deliveredDate: string
}

export interface AdminOrderPaymentView {
  paymentType: string
  paymentStatus: string
  paymentStatusLabel: string
  paidAmount: number
  paidAmountLabel: string
  cardCompany: string
  cardNoMasked: string
  installment: number
  approvalNo: string
  paidDate: string
}

export interface AdminOrderDetail {
  orderSeq: number
  orderNo: string
  userSeq: number
  orderStatus: string
  statusLabel: string
  orderDate: string
  itemsTotal: number
  itemsTotalLabel: string
  totalDiscount: number
  totalDiscountLabel: string
  couponDiscount: number
  couponDiscountLabel: string
  pointUsed: number
  shippingFee: number
  shippingFeeLabel: string
  finalAmount: number
  finalAmountLabel: string
  pointToEarn: number
  items: AdminOrderItemRow[]
  shipping: AdminOrderShippingView | null
  payment: AdminOrderPaymentView | null
}

/* ─── 매퍼 ─── */
function buildItemSummary(firstItemName: string | null, totalItemCount: number): string {
  if (!firstItemName) return '-'
  return totalItemCount > 1 ? `${firstItemName} 외 ${totalItemCount - 1}건` : firstItemName
}

export function toOrderRow(d: AdminOrderListItemDto): AdminOrderRow {
  return {
    orderSeq: d.orderSeq,
    orderNo: d.orderNo,
    orderStatus: d.orderStatus,
    statusLabel: adminOrderStatusLabel(d.orderStatus),
    userSeq: d.userSeq,
    orderDate: fmtDateTime(d.orderDate),
    finalAmount: toNum(d.finalAmount),
    finalAmountLabel: won(d.finalAmount),
    totalItemCount: d.totalItemCount ?? 0,
    itemSummary: buildItemSummary(d.firstItemName, d.totalItemCount ?? 0),
  }
}

function toOrderItemRow(d: OrderItemSnapshotDto): AdminOrderItemRow {
  return {
    itemSeq: d.itemSeq,
    productSeq: d.productSeq,
    optionSeq: d.optionSeq,
    productCode: d.productCode,
    productName: d.productName,
    optionName: d.optionName,
    unitPrice: toNum(d.unitPrice),
    unitPriceLabel: won(d.unitPrice),
    quantity: d.quantity,
    itemAmount: toNum(d.itemAmount),
    itemAmountLabel: won(d.itemAmount),
    mainImageUrl: d.mainImageUrl,
  }
}

function toOrderShipping(d: OrderShippingInfoDto): AdminOrderShippingView {
  return {
    recipientName: d.recipientName,
    recipientPhone: d.recipientPhone,
    zipCode: d.zipCode,
    address: d.address,
    addressDetail: d.addressDetail ?? '',
    shippingMemo: d.shippingMemo ?? '',
    trackingNo: d.trackingNo ?? '',
    shippingStatus: d.shippingStatus,
    shippingStatusLabel: adminShippingStatusLabel(d.shippingStatus),
    shippedDate: fmtDateTime(d.shippedDate),
    deliveredDate: fmtDateTime(d.deliveredDate),
  }
}

function toOrderPayment(d: OrderPaymentInfoDto): AdminOrderPaymentView {
  return {
    paymentType: d.paymentType,
    paymentStatus: d.paymentStatus,
    paymentStatusLabel: adminPaymentStatusLabel(d.paymentStatus),
    paidAmount: toNum(d.paidAmount),
    paidAmountLabel: won(d.paidAmount),
    cardCompany: d.cardCompany ?? '',
    cardNoMasked: d.cardNoMasked ?? '',
    installment: d.installment ?? 0,
    approvalNo: d.approvalNo ?? '',
    paidDate: fmtDateTime(d.paidDate),
  }
}

export function toOrderDetail(d: AdminOrderDetailDto): AdminOrderDetail {
  return {
    orderSeq: d.orderSeq,
    orderNo: d.orderNo,
    userSeq: d.userSeq,
    orderStatus: d.orderStatus,
    statusLabel: adminOrderStatusLabel(d.orderStatus),
    orderDate: fmtDateTime(d.orderDate),
    itemsTotal: toNum(d.itemsTotal),
    itemsTotalLabel: won(d.itemsTotal),
    totalDiscount: toNum(d.totalDiscount),
    totalDiscountLabel: won(d.totalDiscount),
    couponDiscount: toNum(d.couponDiscount),
    couponDiscountLabel: won(d.couponDiscount),
    pointUsed: d.pointUsed ?? 0,
    shippingFee: toNum(d.shippingFee),
    shippingFeeLabel: won(d.shippingFee),
    finalAmount: toNum(d.finalAmount),
    finalAmountLabel: won(d.finalAmount),
    pointToEarn: d.pointToEarn ?? 0,
    items: (d.items ?? []).map(toOrderItemRow),
    shipping: d.shipping ? toOrderShipping(d.shipping) : null,
    payment: d.payment ? toOrderPayment(d.payment) : null,
  }
}

/* ─── API ─── */
export function listOrders(params: OrderSearchParams): Promise<PageResponse<AdminOrderListItemDto>> {
  return adminGet<PageResponse<AdminOrderListItemDto>>('/admin/orders', { params })
}
export function getOrder(orderSeq: number): Promise<AdminOrderDetailDto> {
  return adminGet<AdminOrderDetailDto>(`/admin/orders/${orderSeq}`)
}

/* ─── 훅 ─── */
export const orderKeys = {
  list: (p: OrderSearchParams) => ['admin', 'orders', 'list', p] as const,
  detail: (id: number) => ['admin', 'orders', 'detail', id] as const,
}

export function useOrders(params: OrderSearchParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => listOrders(params),
    select: (page): { rows: AdminOrderRow[]; totalElements: number; totalPages: number } => ({
      rows: page.content.map(toOrderRow),
      totalElements: page.totalElements,
      totalPages: page.totalPages,
    }),
  })
}

export function useOrder(orderSeq: number | null) {
  return useQuery({
    queryKey: orderKeys.detail(orderSeq ?? -1),
    queryFn: () => getOrder(orderSeq as number),
    enabled: orderSeq != null,
    select: toOrderDetail,
  })
}

/* ─── 상태전이 API (O-3~O-7) — 전부 200·data 없음 ───
   전이표 §3.1(주문)/§3.2(배송). 위반 시 409 ORDER_TRANSITION_INVALID. */
export function prepareOrder(orderSeq: number): Promise<void> {
  return adminPatch<void>(`/admin/orders/${orderSeq}/prepare`) // PAID → PREPARING
}
export function cancelOrder(orderSeq: number): Promise<void> {
  return adminPatch<void>(`/admin/orders/${orderSeq}/cancel`) // {PAID|PREPARING} → CANCELED (재고복원, payment 불변)
}
export function shipOrder(orderSeq: number, trackingNo: string): Promise<void> {
  return adminPatch<void>(`/admin/orders/${orderSeq}/ship`, { trackingNo }) // PREPARING→SHIPPING + 배송 READY→SHIPPED (trackingNo 필수)
}
export function inTransitOrder(orderSeq: number): Promise<void> {
  return adminPatch<void>(`/admin/orders/${orderSeq}/in-transit`) // 배송 SHIPPED → IN_TRANSIT (주문상태 불변)
}
export function deliverOrder(orderSeq: number): Promise<void> {
  return adminPatch<void>(`/admin/orders/${orderSeq}/deliver`) // SHIPPING→DELIVERED + 배송 {SHIPPED|IN_TRANSIT}→DELIVERED
}

// 상태전이 훅 묶음 — 성공 시 주문 목록+상세 invalidate(상세 재조회로 갱신 확인).
export function useOrderTransitions(orderSeq: number) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
  return {
    prepare: useMutation({ mutationFn: () => prepareOrder(orderSeq), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: () => cancelOrder(orderSeq), onSuccess: invalidate }),
    ship: useMutation({ mutationFn: (trackingNo: string) => shipOrder(orderSeq, trackingNo), onSuccess: invalidate }),
    inTransit: useMutation({ mutationFn: () => inTransitOrder(orderSeq), onSuccess: invalidate }),
    deliver: useMutation({ mutationFn: () => deliverOrder(orderSeq), onSuccess: invalidate }),
  }
}

/* ─── 버튼 노출 근거(§3.1/3.2) — 임의로 정하지 말 것 ───
   현재 order_status(+ship만 배송상태) 기준으로 허용 액션만. 표에 없는 전이는 백엔드 409. */
export interface OrderActionAvailability {
  canPrepare: boolean // PAID
  canCancel: boolean // PAID | PREPARING
  canShip: boolean // PREPARING (trackingNo 필수)
  canInTransit: boolean // SHIPPING & 배송 SHIPPED
  canDeliver: boolean // SHIPPING
}
export function orderActions(orderStatus: string, shippingStatus: string | null | undefined): OrderActionAvailability {
  return {
    canPrepare: orderStatus === 'PAID',
    canCancel: orderStatus === 'PAID' || orderStatus === 'PREPARING',
    canShip: orderStatus === 'PREPARING',
    canInTransit: orderStatus === 'SHIPPING' && shippingStatus === 'SHIPPED',
    canDeliver: orderStatus === 'SHIPPING',
  }
}
