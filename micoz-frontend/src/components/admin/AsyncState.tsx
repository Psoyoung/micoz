// 관리자 조회 화면 공용 — 로딩/에러/빈 상태 표시(admin 스코프 스타일).
// 쿼리 기반 화면은 이 3상태를 일관되게 렌더한다(계획 A2 완료기준).
import type { CSSProperties, ReactNode } from 'react'
import { ApiError } from '../../api/client'
import { adminErrorMessage } from '../../api/admin/errors'

const box: CSSProperties = {
  padding: '56px 24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  textAlign: 'center',
  color: 'var(--ad-muted)',
  fontFamily: 'var(--sans)',
}

// 로딩 스피너(간단한 회전 링). global.css 애니메이션 의존 없이 인라인 keyframe 은 못 쓰므로 점 3개 펄스로 대체.
export function AdminLoading({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <div style={box}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="ad-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ad-line-strong)', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <div style={{ fontSize: 12.5 }}>{label}</div>
    </div>
  )
}

// 에러 + 재시도. 명세 message(친화 매핑)를 노출.
export function AdminError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = adminErrorMessage(error)
  const code = error instanceof ApiError ? error.code : undefined
  return (
    <div style={box}>
      <div style={{ fontSize: 13.5, color: 'var(--ad-ink)', fontWeight: 500 }}>불러오지 못했습니다</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.6, maxWidth: 420 }}>{message}</div>
      {code && <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', letterSpacing: '0.06em', opacity: 0.6 }}>{code}</div>}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{ marginTop: 4, padding: '8px 18px', background: '#3a2552', color: '#f5f1ea', border: '1px solid #3a2552', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, letterSpacing: '0.02em' }}
        >
          다시 시도
        </button>
      )}
    </div>
  )
}

// 빈 상태.
export function AdminEmpty({ label = '표시할 데이터가 없습니다', hint }: { label?: string; hint?: ReactNode }) {
  return (
    <div style={box}>
      <div style={{ fontSize: 13, color: 'var(--ad-ink)' }}>{label}</div>
      {hint && <div style={{ fontSize: 12, lineHeight: 1.6 }}>{hint}</div>}
    </div>
  )
}
