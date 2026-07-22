// 관리자 로그인 — AdminAuthContext.login 연동(POST /admin/auth/login → GET /admin/me).
// .admin-scope 로 --ad-* 토큰 적용(관리자 디자인 스코프). 실패는 AUTH_INVALID_CREDENTIALS 동일 응답.
import { useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../../auth/AdminAuthContext'
import { adminErrorMessage } from '../../../api/admin/errors'

const field: CSSProperties = { width: '100%', padding: '11px 13px', border: '1px solid var(--ad-line-strong)', background: '#fff', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ad-ink)', outline: 'none' }
const label: CSSProperties = { display: 'block', fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', marginBottom: 7, textTransform: 'uppercase' }

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAdminAuth()
  const [userId, setUserId] = useState('')
  const [userPw, setUserPw] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 가드에서 넘어온 원래 목적지(state.from) 또는 대시보드로 복귀.
  const from = (location.state as { from?: string } | null)?.from ?? '/admin'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      await login(userId.trim(), userPw)
      navigate(from, { replace: true })
    } catch (err) {
      setError(adminErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-scope" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ad-paper)', color: 'var(--ad-ink)', fontFamily: 'var(--sans)', padding: 24 }}>
      <form onSubmit={onSubmit} style={{ width: 'min(400px, 100%)', background: '#fff', border: '1px solid var(--ad-line-strong)', padding: '40px 36px', boxShadow: '0 16px 48px rgba(15, 10, 28, 0.10)' }}>
        <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.28em', marginBottom: 8 }}>MICOZ ADMIN</div>
        <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ad-ink)' }}>관리자 로그인</h1>
        <p style={{ marginTop: 10, marginBottom: 30, fontSize: 12.5, color: 'var(--ad-muted)', lineHeight: 1.6 }}>운영 계정으로 로그인하세요.</p>

        <div style={{ marginBottom: 16 }}>
          <div style={label}>아이디</div>
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="admin01" autoComplete="username" autoFocus style={{ ...field, fontFamily: 'var(--mono)' }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={label}>비밀번호</div>
          <input type="password" value={userPw} onChange={(e) => setUserPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" style={{ ...field, fontFamily: 'var(--mono)' }} />
        </div>

        {error && (
          <div role="alert" style={{ marginTop: 12, fontSize: 12.5, color: '#8a3a2c', lineHeight: 1.6 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{ marginTop: 24, width: '100%', padding: '12px 18px', background: submitting ? '#6b5a80' : '#3a2552', color: '#f5f1ea', border: '1px solid #3a2552', cursor: submitting ? 'default' : 'pointer', fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 13, letterSpacing: '0.02em' }}
        >
          {submitting ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </div>
  )
}
