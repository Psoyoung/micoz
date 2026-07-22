// 로그인 — 출처: 원본 shop/screens-auth-cart.jsx LoginPage. AuthContext.login 연동(POST /auth/login → /me).
// 명세 §1.2 는 userId 로그인이라 첫 필드를 '아이디' 로 바인딩(원본 라벨 '이메일' → '아이디').
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Icon } from '../../../components/shop/icons'
import PrimaryBtn from '../../../components/shop/PrimaryBtn'
import { AuthShell, FieldRow } from './auth-ui'
import { useAuth } from '../../../auth/AuthContext'
import { ApiError } from '../../../api/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [keep, setKeep] = useState(true)
  const [userId, setUserId] = useState('')
  const [userPw, setUserPw] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 가드에서 넘어온 원래 목적지(state.from) 또는 홈으로 복귀.
  const navState = location.state as { from?: string; signedUp?: boolean; reset?: boolean } | null
  const from = navState?.from ?? '/'
  const notice = navState?.signedUp ? '회원가입이 완료되었습니다. 로그인해주세요.' : navState?.reset ? '비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.' : ''

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      await login(userId.trim(), userPw)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 14 }}>SIGN IN</div>
      <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em' }}>로그인</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 14, lineHeight: 1.7 }}>
        아직 회원이 아니신가요?{' '}
        <button
          onClick={() => navigate('/signup')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--plum-700)', textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          회원가입
        </button>
      </p>

      {notice && (
        <div role="status" style={{ marginTop: 24, padding: '12px 16px', background: 'var(--plum-100)', color: 'var(--plum-800)', fontSize: 13, lineHeight: 1.6 }}>
          {notice}
        </div>
      )}

      <form style={{ marginTop: 40 }} onSubmit={onSubmit}>
        <FieldRow label="아이디" placeholder="아이디를 입력하세요" value={userId} onChange={setUserId} autoComplete="username" />
        <FieldRow label="비밀번호" type="password" placeholder="••••••••" value={userPw} onChange={setUserPw} autoComplete="current-password" />

        {error && (
          <div role="alert" style={{ marginTop: 4, marginBottom: 4, fontSize: 13, color: '#c0392b', lineHeight: 1.6 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 28 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--ink)' }}>
            <span
              style={{ width: 16, height: 16, background: keep ? 'var(--plum-700)' : 'transparent', border: `1.5px solid ${keep ? 'var(--plum-700)' : 'var(--line-strong)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setKeep(!keep)}
            >
              {keep && Icon.check(11, 'var(--cream)')}
            </span>
            로그인 유지
          </label>
          <button
            type="button"
            onClick={() => navigate('/find')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--muted)', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            아이디 / 비밀번호 찾기
          </button>
        </div>

        <PrimaryBtn full size="lg" disabled={submitting}>{submitting ? '로그인 중…' : '로그인'}</PrimaryBtn>
      </form>
    </AuthShell>
  )
}
