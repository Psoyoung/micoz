// 공통 API 타입 — 출처: docs/micoz_api.md §0 (계약 정렬 Phase 0, 타입만/동작 없음).
// 도메인 DTO(productSeq/productName 등)는 각 도메인 Phase 에서 추가한다.

// §0.4 ErrorCode 일람 (36종). code 는 이 enum 이름 또는 'SUCCESS'.
export type ErrorCode =
  // 공통
  | 'COMMON_VALIDATION_ERROR'
  | 'COMMON_INVALID_REQUEST'
  | 'COMMON_RESOURCE_NOT_FOUND'
  | 'COMMON_METHOD_NOT_ALLOWED'
  | 'COMMON_INTERNAL_ERROR'
  // 인증
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  // 사용자
  | 'USER_NOT_FOUND'
  | 'USER_DUPLICATED_ID'
  | 'USER_AGREEMENT_REQUIRED'
  | 'USER_REFERRER_NOT_FOUND'
  // 상품
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_SOLD_OUT'
  // 장바구니
  | 'CART_OPTION_REQUIRED'
  | 'CART_ITEM_NOT_FOUND'
  // 주문
  | 'ORDER_NOT_FOUND'
  | 'ORDER_AMOUNT_MISMATCH'
  | 'ORDER_INVALID_STATUS'
  | 'ORDER_EMPTY_ITEMS'
  // 배송지
  | 'ADDRESS_NOT_FOUND'
  | 'ADDRESS_REQUIRED'
  // 결제
  | 'PAY_APPROVAL_FAILED'
  // 반품
  | 'RETURN_PERIOD_EXPIRED'
  | 'RETURN_ITEM_INVALID'
  | 'RETURN_QUANTITY_EXCEEDED'
  | 'RETURN_NOT_FOUND'
  | 'RETURN_EMPTY_ITEMS'
  // 리뷰
  | 'REVIEW_NOT_FOUND'
  | 'REVIEW_NOT_ALLOWED'
  | 'REVIEW_ALREADY_WRITTEN'
  // 쿠폰 / 포인트
  | 'COUPON_NOT_APPLICABLE'
  | 'POINT_INSUFFICIENT'
  // 문의
  | 'INQUIRY_NOT_FOUND'
  // ─── 관리자(admin_api.md) 고유 코드 ───
  // 관리자 계정 / 회원
  | 'ADMIN_SELF_LOCKOUT'
  | 'ADMIN_LAST_ADMIN_PROTECTED'
  | 'ADMIN_ROOT_PROTECTED'
  | 'GRADE_NOT_FOUND'
  | 'MEMBER_INVALID_STATUS'
  // 카테고리
  | 'CATEGORY_NOT_FOUND'
  | 'CATEGORY_INVALID_PARENT'
  | 'CATEGORY_DUPLICATED_SLUG'
  | 'CATEGORY_HAS_CHILDREN'
  // 상품(관리자)
  | 'PRODUCT_DUPLICATED_CODE'
  | 'PRODUCT_INVALID_STATUS'
  | 'PRODUCT_OPTION_NOT_FOUND'
  | 'PRODUCT_IMAGE_NOT_FOUND'
  | 'PRODUCT_HAS_ORDERS'
  | 'LABEL_NOT_FOUND'
  // 배너 / 배송설정
  | 'BANNER_NOT_FOUND'
  | 'SHIPPING_SETTING_NOT_FOUND'
  // 주문 / 반품 / 문의 상태전이
  | 'ORDER_TRANSITION_INVALID'
  | 'RETURN_TRANSITION_INVALID'
  | 'INQUIRY_TRANSITION_INVALID'

// 응답 봉투의 code 값: 성공 'SUCCESS' 또는 ErrorCode (§0.1/§0.3).
export type ApiCode = 'SUCCESS' | ErrorCode

// §0.1 공통 응답 봉투. data 는 null 인 경우 직렬화 생략(@JsonInclude(NON_NULL)) → optional.
// 주의(§0.4): HTTP 200 이라도 code !== 'SUCCESS' 로 비즈니스 오류가 올 수 있다 → 항상 code 로 분기.
export interface ApiResponse<T> {
  code: ApiCode
  message: string
  data?: T
}

// §0.2 페이징 응답. 쿼리 파라미터: page(0-based)/size/sort.
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
