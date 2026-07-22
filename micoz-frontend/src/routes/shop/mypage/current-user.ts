// 목업 현재 로그인 사용자 — 인증이 없으므로 MEMBERS 중 1명(박서영)을 현재 사용자로 사용.
// 실제 세션 사용자는 API/인증 단계에서 대체. id/birth/marketing 은 MEMBERS 에 없어 목업 보충.
import { MEMBERS } from '../../../lib/data'

const m = MEMBERS[0]

export const CURRENT_USER = {
  id: 'seoyoung_micoz',
  name: m.name,
  email: m.email,
  phone: m.phone,
  gradeName: m.gradeName,
  birth: '1994-08-12',
  marketing: true,
}
