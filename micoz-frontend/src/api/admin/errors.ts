// 관리자 ApiError → 친화 메시지. 출처: docs/admin_api.md §1.4 + 도메인 고유 코드.
// auth-errors.ts 패턴 재사용. 도메인별 신규 코드는 각 Phase 에서 이 맵에 추가한다.
import { ApiError } from '../client'

const MESSAGES: Record<string, string> = {
  // 공통(§1.4)
  COMMON_INVALID_REQUEST: '잘못된 요청입니다. 입력값을 확인해주세요.',
  COMMON_INTERNAL_ERROR: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
  // 인증(§1.1)
  AUTH_INVALID_CREDENTIALS: '아이디 또는 비밀번호가 올바르지 않습니다.',
  AUTH_UNAUTHORIZED: '인증이 필요합니다. 다시 로그인해주세요.',
  AUTH_FORBIDDEN: '접근 권한이 없습니다.',
  // ─── A3a 변이(도메인 검증) ───
  USER_NOT_FOUND: '대상 회원을 찾을 수 없습니다.',
  USER_DUPLICATED_ID: '이미 사용 중인 아이디입니다.',
  GRADE_NOT_FOUND: '존재하지 않는 등급입니다.',
  MEMBER_INVALID_STATUS: '허용되지 않은 회원 상태입니다.',
  POINT_INSUFFICIENT: '차감 후 포인트 잔액이 음수가 됩니다.',
  // 카테고리
  CATEGORY_NOT_FOUND: '대상 카테고리를 찾을 수 없습니다.',
  CATEGORY_INVALID_PARENT: '2단계까지만 만들 수 있습니다. 중분류 아래에는 하위 카테고리를 둘 수 없습니다.',
  CATEGORY_DUPLICATED_SLUG: '이미 사용 중인 URL 슬러그입니다.',
  CATEGORY_HAS_CHILDREN: '하위 카테고리 또는 소속 상품이 있어 삭제할 수 없습니다.',
  // 상품
  PRODUCT_NOT_FOUND: '대상 상품을 찾을 수 없습니다.',
  PRODUCT_DUPLICATED_CODE: '이미 사용 중인 상품코드입니다.',
  PRODUCT_INVALID_STATUS: '허용되지 않은 판매 상태입니다.',
  PRODUCT_OPTION_NOT_FOUND: '대상 옵션을 찾을 수 없습니다.',
  PRODUCT_IMAGE_NOT_FOUND: '대상 이미지를 찾을 수 없습니다.',
  PRODUCT_HAS_ORDERS: '주문 이력이 있어 완전 삭제할 수 없습니다(비활성 처리됨).',
  LABEL_NOT_FOUND: '존재하지 않는 라벨입니다.',
  // 배너 / 배송설정
  BANNER_NOT_FOUND: '대상 배너를 찾을 수 없습니다.',
  SHIPPING_SETTING_NOT_FOUND: '배송 설정을 불러올 수 없습니다. 관리자에게 문의하세요.',
  // ─── A3b 상태전이(409) ───
  ORDER_TRANSITION_INVALID: '현재 주문 상태에서는 할 수 없는 작업입니다. 새로고침 후 다시 확인해주세요.',
  RETURN_TRANSITION_INVALID: '현재 반품 상태에서는 할 수 없는 작업입니다. 새로고침 후 다시 확인해주세요.',
  INQUIRY_TRANSITION_INVALID: '현재 문의 상태에서는 할 수 없는 작업입니다.',
  // ─── A3c 관리자 계정 보호(409) ───
  ADMIN_SELF_LOCKOUT: '본인 계정에는 이 작업을 수행할 수 없습니다.',
  ADMIN_LAST_ADMIN_PROTECTED: '마지막 활성 관리자는 비활성화하거나 강등할 수 없습니다.',
  ADMIN_ROOT_PROTECTED: 'ROOT 관리자 계정은 변경할 수 없습니다.',
  UNKNOWN: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
}

export function adminErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    // COMMON_VALIDATION_ERROR 등은 서버 메시지가 구체적("{필드}: {사유}")이라 그대로 노출.
    return MESSAGES[err.code] ?? err.message ?? '요청을 처리하지 못했습니다.'
  }
  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
}
