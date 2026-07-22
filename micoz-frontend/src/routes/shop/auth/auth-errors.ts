// auth ApiError → 폼 표시 메시지. 코드별 친화 메시지, 없으면 서버 message 사용.
import { ApiError } from '../../../api/client'

const MESSAGES: Record<string, string> = {
  USER_DUPLICATED_ID: '이미 사용 중인 아이디입니다.',
  USER_REFERRER_NOT_FOUND: '추천인을 찾을 수 없습니다.',
  USER_AGREEMENT_REQUIRED: '필수 약관에 동의해주세요.',
  AUTH_INVALID_CREDENTIALS: '아이디 또는 비밀번호가 올바르지 않습니다.',
  // 백엔드가 처리 못한 케이스(예: 일부 입력 조합)는 500 으로 떨어지므로 친화 메시지로 정규화.
  COMMON_INTERNAL_ERROR: '요청을 처리하지 못했습니다. 입력값을 확인 후 다시 시도해주세요.',
  UNKNOWN: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
}

export function authErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    // COMMON_VALIDATION_ERROR 등은 서버 메시지가 구체적("userPw: size must be...")이라 그대로 노출.
    return MESSAGES[err.code] ?? err.message ?? '요청을 처리하지 못했습니다.'
  }
  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
}
