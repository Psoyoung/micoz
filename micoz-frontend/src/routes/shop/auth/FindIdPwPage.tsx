// 아이디·비밀번호 찾기 — 출처: 원본 shop/screens-auth-cart.jsx FindIdPwPage.
// 아이디 찾기 → POST /auth/find-id {userName,email}, 비밀번호 찾기 → POST /auth/reset-password {userId,userName,email,newPassword}.
// 원본/명세 충돌 보고:
//   - API find-id/reset 는 이메일 기준만 지원 → 인증방법 라디오(휴대폰/휴대폰인증)는 마크업 유지하되 "이메일만 지원" 안내.
//   - reset 에는 userName·newPassword 가 필요하나 원본 pw 탭엔 없음 → '이름'·'새 비밀번호' 필드 추가.
//   - find-id 미일치는 열거방지로 동일 응답(§1.5).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PrimaryBtn from '../../../components/shop/PrimaryBtn'
import { AuthShell, FindFieldRow } from './auth-ui'
import { findId, resetPassword } from '../../../api/auth'
import { authErrorMessage } from './auth-errors'

export default function FindIdPwPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'id' | 'pw'>('id')
  const [method, setMethod] = useState('email') // email | phone | phoneAuth
  const [name, setName] = useState('')
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [newPw, setNewPw] = useState('')
  const [foundId, setFoundId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const resetState = () => { setError(''); setFoundId(null) }
  const switchTab = (k: 'id' | 'pw') => { setTab(k); resetState() }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    resetState()
    // API 는 이메일 기준만 지원
    if (method !== 'email') { setError('현재 이메일 인증만 지원됩니다.'); return }

    if (tab === 'id') {
      if (!name.trim() || !email.trim()) { setError('이름과 이메일을 입력해주세요.'); return }
      setSubmitting(true)
      try {
        const res = await findId({ userName: name.trim(), email: email.trim() })
        if (res.userId) setFoundId(res.userId)
        else setError('일치하는 계정 정보를 찾을 수 없습니다.')
      } catch (err) {
        setError(authErrorMessage(err))
      } finally {
        setSubmitting(false)
      }
    } else {
      if (!userId.trim() || !name.trim() || !email.trim()) { setError('아이디·이름·이메일을 모두 입력해주세요.'); return }
      if (newPw.length < 8 || newPw.length > 64) { setError('새 비밀번호는 8~64자로 입력해주세요.'); return }
      setSubmitting(true)
      try {
        await resetPassword({ userId: userId.trim(), userName: name.trim(), email: email.trim(), newPassword: newPw })
        navigate('/login', { replace: true, state: { reset: true } })
      } catch (err) {
        setError(authErrorMessage(err))
      } finally {
        setSubmitting(false)
      }
    }
  }

  return (
    <AuthShell>
      <div style={{ marginBottom: 36, textAlign: 'left' }}>
        <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 14 }}>FIND ID · PASSWORD</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em' }}>아이디 · 비밀번호 찾기</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--line)', marginBottom: 32 }}>
        {(
          [
            ['id', '아이디 찾기'],
            ['pw', '비밀번호 찾기'],
          ] as ['id' | 'pw', string][]
        ).map(([k, l]) => {
          const active = tab === k
          return (
            <button
              key={k}
              onClick={() => switchTab(k)}
              style={{
                padding: '14px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${active ? 'var(--plum-700)' : 'transparent'}`,
                marginBottom: -1,
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                fontSize: 13.5,
                fontWeight: active ? 500 : 400,
                letterSpacing: '0.04em',
                color: active ? 'var(--plum-700)' : 'var(--muted)',
              }}
            >
              {l}
            </button>
          )
        })}
      </div>

      <form onSubmit={onSubmit}>
        {/* 인증방법 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase' }}>인증방법</div>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            {(
              [
                ['email', '이메일'],
                ['phone', '휴대폰번호'],
                ['phoneAuth', '휴대폰인증'],
              ] as [string, string][]
            ).map(([k, l]) => {
              const sel = method === k
              return (
                <label key={k} onClick={() => { setMethod(k); resetState() }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, color: 'var(--ink)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${sel ? 'var(--plum-700)' : 'var(--line-strong)'}`, background: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {sel && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--plum-700)' }} />}
                  </span>
                  {l}
                </label>
              )
            })}
          </div>
        </div>

        {/* Fields */}
        {tab === 'pw' && <FindFieldRow label="아이디" placeholder="아이디" value={userId} onChange={setUserId} autoComplete="username" />}
        <FindFieldRow label="이름" placeholder="홍길동" value={name} onChange={setName} autoComplete="name" />
        {method === 'email' && <FindFieldRow label="이메일" placeholder="name@email.com" type="email" value={email} onChange={setEmail} autoComplete="email" />}
        {(method === 'phone' || method === 'phoneAuth') && <FindFieldRow label="휴대폰번호" placeholder="010-0000-0000" type="tel" value={phone} onChange={setPhone} autoComplete="tel" />}
        {tab === 'pw' && <FindFieldRow label="새 비밀번호" placeholder="8~64자" type="password" value={newPw} onChange={setNewPw} autoComplete="new-password" />}

        {foundId && (
          <div role="status" style={{ marginTop: 4, marginBottom: 8, padding: '12px 16px', background: 'var(--plum-100)', color: 'var(--plum-800)', fontSize: 13.5, lineHeight: 1.6 }}>
            회원님의 아이디는 <strong>{foundId}</strong> 입니다.
          </div>
        )}
        {error && (
          <div role="alert" style={{ marginTop: 4, marginBottom: 8, fontSize: 13, color: '#c0392b', lineHeight: 1.6 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 28 }}>
          <PrimaryBtn full size="lg" disabled={submitting}>{submitting ? '확인 중…' : '확인'}</PrimaryBtn>
        </div>

        <p style={{ marginTop: 28, padding: '0 4px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.75, textAlign: 'center', display: 'flex', alignItems: 'flex-start', gap: 6, justifyContent: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--muted)', fontSize: 9, color: 'var(--muted)', flexShrink: 0, marginTop: 2, fontFamily: 'var(--serif-en)' }}>i</span>
          <span>
            SNS 계정으로 가입 후 별도의 휴대폰 인증을 하지 않은 경우
            <br />
            [휴대폰인증]으로 진행 시 아이디가 노출되지 않을 수 있습니다.
          </span>
        </p>

        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 13 }}>
          <button type="button" onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            로그인으로 돌아가기
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
