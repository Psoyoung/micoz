// 회원가입 — 출처: 원본 shop/screens-auth-cart.jsx SignupPage. POST /auth/signup 연동.
// 원본엔 '아이디' 필드가 없으나 API(SignupRequest)는 userId 필수 → 아이디 필드 추가(보고).
// 휴대폰 '인증번호 전송'은 대응 API 없음 → 원본 마크업 유지하되 목업(no-op).
// 비번 규칙은 Swagger 계약(@Size 8~64)만 클라 선검증. 성공 시 로그인 유도(자동 로그인 아님).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PrimaryBtn from '../../../components/shop/PrimaryBtn'
import { AuthShell, FieldRow, CheckRow } from './auth-ui'
import { signup } from '../../../api/auth'
import { authErrorMessage } from './auth-errors'

type Agree = { all: boolean; terms: boolean; privacy: boolean; marketing: boolean }

export default function SignupPage() {
  const navigate = useNavigate()
  const [agree, setAgree] = useState<Agree>({ all: false, terms: false, privacy: false, marketing: false })
  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pw, setPw] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggleAll = () => {
    const v = !agree.all
    setAgree({ all: v, terms: v, privacy: v, marketing: v })
  }
  const toggle = (k: 'terms' | 'privacy' | 'marketing') => {
    const next = { ...agree, [k]: !agree[k] }
    next.all = next.terms && next.privacy && next.marketing
    setAgree(next)
  }

  // 클라 선검증 — Swagger @Size 계약 기준(userId 4~50, userPw 8~64, userName 필수).
  const validate = (): string | null => {
    if (userId.trim().length < 4 || userId.trim().length > 50) return '아이디는 4~50자로 입력해주세요.'
    if (!name.trim()) return '이름을 입력해주세요.'
    if (pw.length < 8 || pw.length > 64) return '비밀번호는 8~64자로 입력해주세요.'
    if (pw !== pwConfirm) return '비밀번호가 일치하지 않습니다.'
    if (!agree.terms || !agree.privacy) return '필수 약관에 동의해주세요.'
    return null
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const v = validate()
    if (v) { setError(v); return }
    setError('')
    setSubmitting(true)
    try {
      await signup({
        userId: userId.trim(),
        userPw: pw,
        userName: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        serviceYn: agree.terms ? 'Y' : 'N',
        privacyYn: agree.privacy ? 'Y' : 'N',
        marketingYn: agree.marketing ? 'Y' : 'N',
      })
      // 성공 → 로그인 유도(원본 흐름 보존)
      navigate('/login', { replace: true, state: { signedUp: true } })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 14 }}>CREATE ACCOUNT</div>
      <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em' }}>회원가입</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 14, lineHeight: 1.7 }}>
        이미 회원이신가요?{' '}
        <button
          onClick={() => navigate('/login')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--plum-700)', textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          로그인
        </button>
      </p>

      <form style={{ marginTop: 36 }} onSubmit={onSubmit}>
        <FieldRow label="아이디" placeholder="4~50자" value={userId} onChange={setUserId} autoComplete="username" />
        <FieldRow label="이름" placeholder="홍길동" value={name} onChange={setName} autoComplete="name" />
        <FieldRow label="이메일" placeholder="name@email.com" value={email} onChange={setEmail} autoComplete="email" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
          <FieldRow label="휴대폰 번호" placeholder="010-0000-0000" value={phone} onChange={setPhone} autoComplete="tel" />
          <button
            type="button"
            style={{ padding: '14px 18px', background: 'transparent', border: '1px solid var(--plum-700)', color: 'var(--plum-700)', cursor: 'pointer', fontSize: 12, letterSpacing: '0.18em', whiteSpace: 'nowrap', marginBottom: 20, height: 46 }}
          >
            인증번호 전송
          </button>
        </div>
        <FieldRow label="비밀번호" type="password" placeholder="8~64자" value={pw} onChange={setPw} autoComplete="new-password" />
        <FieldRow label="비밀번호 확인" type="password" placeholder="••••••••" value={pwConfirm} onChange={setPwConfirm} autoComplete="new-password" />

        {/* 약관 */}
        <div style={{ marginTop: 12, padding: 20, background: 'var(--paper)', border: '1px solid var(--line)' }}>
          <CheckRow checked={agree.all} onClick={toggleAll} bold>
            전체 동의
          </CheckRow>
          <div style={{ height: 1, background: 'var(--line)', margin: '12px 0' }} />
          <CheckRow checked={agree.terms} onClick={() => toggle('terms')}>
            이용약관 동의 (필수)
          </CheckRow>
          <CheckRow checked={agree.privacy} onClick={() => toggle('privacy')}>
            개인정보 수집 및 이용 동의 (필수)
          </CheckRow>
          <CheckRow checked={agree.marketing} onClick={() => toggle('marketing')}>
            마케팅 수신 동의 (선택)
          </CheckRow>
        </div>

        {error && (
          <div role="alert" style={{ marginTop: 16, fontSize: 13, color: '#c0392b', lineHeight: 1.6 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 32 }}>
          <PrimaryBtn full size="lg" disabled={submitting}>{submitting ? '가입 중…' : '가입 완료'}</PrimaryBtn>
        </div>
      </form>
    </AuthShell>
  )
}
