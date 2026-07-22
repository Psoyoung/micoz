// 관리자 전용 enum 라벨맵 — 출처: docs/admin_api.md §2.
// D1 결정: shop 공유 enums.ts 를 건드리지 않고 관리자 값을 여기로 격리한다.
//   (특히 OrderStatus 는 admin 이 SHIPPING + 별도 ShippingStatus 2컬럼 — shop 의 SHIPPED 와 다름.)
// 매퍼는 DTO 문자열을 그대로 담고, 표시 시 이 맵으로 한글화한다. 미지 값은 원문 유지(안전).

function label<T extends string>(map: Record<T, string>) {
  return (v: string): string => (map as Record<string, string>)[v] ?? v
}

// §2.1 주문 상태
export const ADMIN_ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: '결제대기', PAID: '결제완료', PREPARING: '준비중', SHIPPING: '배송중',
  DELIVERED: '배송완료', CANCELED: '취소', RETURNED: '반품',
}
export const adminOrderStatusLabel = label(ADMIN_ORDER_STATUS_LABEL)

// §2.2 배송 상태
export const ADMIN_SHIPPING_STATUS_LABEL: Record<string, string> = {
  READY: '출고준비', SHIPPED: '출고됨', IN_TRANSIT: '배송중', DELIVERED: '배송완료',
}
export const adminShippingStatusLabel = label(ADMIN_SHIPPING_STATUS_LABEL)

// §2.3 반품 상태
export const ADMIN_RETURN_STATUS_LABEL: Record<string, string> = {
  REQUESTED: '신청', APPROVED: '승인', COLLECTED: '회수완료', INSPECTED: '검수완료',
  COMPLETED: '완료', REJECTED: '반려',
}
export const adminReturnStatusLabel = label(ADMIN_RETURN_STATUS_LABEL)

// §2.4 반품 유형
export const ADMIN_RETURN_TYPE_LABEL: Record<string, string> = {
  CANCEL: '취소', EXCHANGE: '교환', RETURN: '반품',
}
export const adminReturnTypeLabel = label(ADMIN_RETURN_TYPE_LABEL)

// 반품 사유(§R return_reason_type)
export const ADMIN_RETURN_REASON_LABEL: Record<string, string> = {
  CHANGE_OF_MIND: '단순변심', DEFECT: '불량', WRONG_DELIVERY: '오배송', ETC: '기타',
}
export const adminReturnReasonLabel = label(ADMIN_RETURN_REASON_LABEL)

// §2.5 문의 상태(2상태만)
export const ADMIN_INQUIRY_STATUS_LABEL: Record<string, string> = {
  WAITING: '답변대기', ANSWERED: '답변완료',
}
export const adminInquiryStatusLabel = label(ADMIN_INQUIRY_STATUS_LABEL)

// §2.6 문의 유형
export const ADMIN_INQUIRY_TYPE_LABEL: Record<string, string> = {
  PRODUCT: '상품', ORDER: '주문', DELIVERY: '배송', RETURN: '교환·반품', ETC: '기타',
}
export const adminInquiryTypeLabel = label(ADMIN_INQUIRY_TYPE_LABEL)

// §2.7 결제 상태
export const ADMIN_PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: '결제대기', PAID: '결제완료', CANCELED: '취소', REFUNDED: '환불',
}
export const adminPaymentStatusLabel = label(ADMIN_PAYMENT_STATUS_LABEL)

// §2.8 회원 등급
export const ADMIN_GRADE_LABEL: Record<string, string> = {
  MEMBER: '회원', SELLER: '셀러', MASTER: '마스터', SENIOR: '상무', EXECUTIVE: '전무',
}
export const adminGradeLabel = label(ADMIN_GRADE_LABEL)

// §2.9 회원 운영 상태
export const ADMIN_MEMBER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: '정상', DORMANT: '휴면', SUSPENDED: '정지',
}
export const adminMemberStatusLabel = label(ADMIN_MEMBER_STATUS_LABEL)

// §2.11 상품 판매 상태
export const ADMIN_PRODUCT_STATUS_LABEL: Record<string, string> = {
  ON_SALE: '판매중', LOW_STOCK: '재고부족', SOLD_OUT: '품절', STOPPED: '판매중지',
}
export const adminProductStatusLabel = label(ADMIN_PRODUCT_STATUS_LABEL)

// 배너 타입(§S)
export const ADMIN_BANNER_TYPE_LABEL: Record<string, string> = {
  HERO: '메인', CATEGORY: '카테고리', PROMO: '프로모션',
}
export const adminBannerTypeLabel = label(ADMIN_BANNER_TYPE_LABEL)
