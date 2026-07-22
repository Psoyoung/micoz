// MICOZ 도메인 enum (코드성 값 → TS 유니언) + 한글 라벨맵 + 파생 헬퍼
// 출처: docs/micoz_schema.sql 의 COLUMN COMMENT 를 진실의 원천으로 삼는다.
// 화면 표시는 원본 목업의 한글값을 라벨맵으로 복원한다.

/* ─── 사용자 / 권한 ─────────────────────────────────────── */
export type UserRole = 'CUSTOMER' | 'ADMIN'

// mst_user.user_status — 스키마: ACTIVE/DORMANT/WITHDRAWN
// WITHDRAW_REQUESTED 는 목업 '탈퇴신청' 보존을 위해 추가 (스키마 보강 후보)
export type UserStatus = 'ACTIVE' | 'DORMANT' | 'WITHDRAW_REQUESTED' | 'WITHDRAWN'
export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: '활성',
  DORMANT: '휴면',
  WITHDRAW_REQUESTED: '탈퇴신청',
  WITHDRAWN: '탈퇴',
}

/* ─── 상품 ─────────────────────────────────────────────── */
export type ProductStatus = 'ON_SALE' | 'LOW_STOCK' | 'SOLD_OUT' | 'STOPPED'
export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  ON_SALE: '판매중',
  LOW_STOCK: '재고부족',
  SOLD_OUT: '품절',
  STOPPED: '판매중지',
}

export type ImageType = 'MAIN' | 'SUB' | 'DETAIL'

/* ─── 주문 / 결제 / 배송 ────────────────────────────────── */
// API 정렬 §7.3/7.4 — order_status 는 SHIPPED(배송중) 사용(스키마 SHIPPING→SHIPPED). PREPARING 은 §8.1 확인.
export type OrderStatus =
  | 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELED' | 'RETURNED'
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: '입금대기',
  PAID: '결제완료',
  PREPARING: '준비중',
  SHIPPED: '배송중',
  DELIVERED: '배송완료',
  CANCELED: '취소',
  RETURNED: '반품',
}

export type OrderItemStatus =
  | 'NORMAL' | 'CANCEL_REQUESTED' | 'CANCELED' | 'RETURN_REQUESTED' | 'RETURNED' | 'EXCHANGED'

// 스키마 정렬 — 결제수단 superset, 체크아웃 선택은 CARD/KAKAO/NAVER (3종 제한은 Phase 4 UI 에서만).
// API §7.2 키 정렬: KAKAOPAY→KAKAO, NAVERPAY→NAVER (rename만, 나머지 수단은 superset 으로 보존).
export type PaymentType =
  | 'CARD' | 'VBANK' | 'BANK' | 'PHONE'
  | 'KAKAO' | 'NAVER' | 'TOSS' | 'SAMSUNGPAY' | 'PAYCO' | 'POINT'
export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  CARD: '카드',
  VBANK: '가상계좌',
  BANK: '계좌이체',
  PHONE: '휴대폰결제',
  KAKAO: '카카오페이',
  NAVER: '네이버페이',
  TOSS: '토스',
  SAMSUNGPAY: '삼성페이',
  PAYCO: '페이코',
  POINT: '포인트',
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELED' | 'REFUNDED'
// 스키마 정렬 — 현재 미사용(표시는 deriveOrderDisplayStatus). API/후속 화면용 보존.
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: '대기',
  PAID: '결제완료',
  CANCELED: '취소',
  REFUNDED: '환불',
}

export type ShippingStatus = 'READY' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED'
export const SHIPPING_STATUS_LABEL: Record<ShippingStatus, string> = {
  READY: '준비중',
  SHIPPED: '출고',
  IN_TRANSIT: '배송중',
  DELIVERED: '배송완료',
}

/* ─── 취소 / 교환 / 반품 ────────────────────────────────── */
export type ReturnType = 'CANCEL' | 'EXCHANGE' | 'RETURN'
export const RETURN_TYPE_LABEL: Record<ReturnType, string> = {
  CANCEL: '취소',
  EXCHANGE: '교환',
  RETURN: '반품',
}

// API §8.2 정렬: PICKUP→COLLECTED, INSPECTING→INSPECTED (표시 라벨 회수중/검수중 은 연속성 위해 유지).
export type ReturnStatus =
  | 'REQUESTED' | 'APPROVED' | 'COLLECTED' | 'INSPECTED' | 'COMPLETED' | 'REJECTED'
export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: '신청',
  APPROVED: '승인',
  COLLECTED: '회수중',
  INSPECTED: '검수중',
  COMPLETED: '완료',
  REJECTED: '반려',
}

// API §8.1 정렬: CHANGE_MIND→CHANGE_OF_MIND, OTHER→ETC.
export type ReturnReasonType = 'CHANGE_OF_MIND' | 'DEFECT' | 'WRONG_DELIVERY' | 'ETC'
export const RETURN_REASON_LABEL: Record<ReturnReasonType, string> = {
  CHANGE_OF_MIND: '단순변심',
  DEFECT: '불량',
  WRONG_DELIVERY: '오배송',
  ETC: '기타',
}

/* ─── 쿠폰 / 포인트 ─────────────────────────────────────── */
// 스키마 정렬 — 미이식 도메인(쿠폰·포인트 화면 없음). 값은 API §11.1 정렬(PERCENT/FIXED).
export type CouponType = 'PERCENT' | 'FIXED'
export const COUPON_TYPE_LABEL: Record<CouponType, string> = {
  PERCENT: '정률',
  FIXED: '정액',
}

export type CouponStatus = 'AVAILABLE' | 'USED' | 'EXPIRED'
export const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  AVAILABLE: '사용가능',
  USED: '사용완료',
  EXPIRED: '만료',
}

export type PointType = 'EARN' | 'USE' | 'EXPIRE' | 'CANCEL'
export const POINT_TYPE_LABEL: Record<PointType, string> = {
  EARN: '적립',
  USE: '사용',
  EXPIRE: '소멸',
  CANCEL: '취소환원',
}

/* ─── 1:1 문의 ─────────────────────────────────────────── */
// API §12.2 유저 응답값은 WAITING/ANSWERED. IN_PROGRESS/CLOSED 는 admin superset(유저 응답엔 없음).
export type InquiryStatus = 'WAITING' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED'
export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  WAITING: '대기',
  IN_PROGRESS: '진행중',
  ANSWERED: '답변완료',
  CLOSED: '종료',
}

// API §12.1 정렬 — 5종 (기존 7종 코드셋 폐기).
export type InquiryType = 'PRODUCT' | 'ORDER' | 'DELIVERY' | 'RETURN' | 'ETC'
export const INQUIRY_TYPE_LABEL: Record<InquiryType, string> = {
  PRODUCT: '상품',
  ORDER: '주문',
  DELIVERY: '배송',
  RETURN: '교환 · 반품',
  ETC: '기타',
}

/* ─── 배너 ─────────────────────────────────────────────── */
// 스키마 정렬 — 미이식(배너 타입 라벨 미표시, BannerView 는 항상 HERO). API/후속 화면용 보존.
export type BannerType = 'HERO' | 'CATEGORY' | 'PROMO'
export const BANNER_TYPE_LABEL: Record<BannerType, string> = {
  HERO: '메인',
  CATEGORY: '카테고리',
  PROMO: '프로모션',
}

/* ─── 파생 헬퍼 ─────────────────────────────────────────── */

// D-6: 구체 payment_type 을 그룹 라벨(카드/계좌이체/무통장입금/간편결제/…)로 묶어 표시
// 원본 주문관리 표시 문자열 보존: CARD='카드', BANK='계좌이체', KAKAO 등 간편결제군='간편결제'.
// BANK(실시간 계좌이체)와 VBANK(가상계좌·무통장입금)는 서로 다른 결제수단이므로 분리한다.
export function paymentGroupLabel(type: PaymentType): string {
  switch (type) {
    case 'CARD':
      return '카드'
    case 'BANK':
      return '계좌이체'
    case 'VBANK':
      return '무통장입금'
    case 'KAKAO':
    case 'NAVER':
    case 'TOSS':
    case 'SAMSUNGPAY':
    case 'PAYCO':
      return '간편결제'
    case 'PHONE':
      return '휴대폰결제'
    case 'POINT':
      return '포인트'
  }
}

// D-6: OrderStatus 에 REFUNDED 를 추가하지 않고, order_status + payment_status 조합으로 '환불' 표시 파생
export function deriveOrderDisplayStatus(order: {
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
}): string {
  if (order.orderStatus === 'RETURNED' && order.paymentStatus === 'REFUNDED') return '환불'
  return ORDER_STATUS_LABEL[order.orderStatus]
}

// 배송 컬럼 표시: 취소/반품 주문은 배송 상태가 N/A(null) 이므로 주문 상태에서 파생
// 원본 보존: 입금대기(PENDING) 주문은 출고 전이라 배송 '대기' 로 표시,
//   결제완료 주문의 READY 는 '준비중'. (데이터단계가 두 경우를 모두 READY 로 인코딩하므로 표시단에서 분기.)
export function deriveOrderShippingDisplay(order: {
  orderStatus: OrderStatus
  shippingStatus: ShippingStatus | null
}): string {
  if (order.shippingStatus === null) {
    if (order.orderStatus === 'CANCELED') return '취소'
    if (order.orderStatus === 'RETURNED') return '반품완료'
    return '-'
  }
  if (order.orderStatus === 'PENDING' && order.shippingStatus === 'READY') return '대기'
  return SHIPPING_STATUS_LABEL[order.shippingStatus]
}
