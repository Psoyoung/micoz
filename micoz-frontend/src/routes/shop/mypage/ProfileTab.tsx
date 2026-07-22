// 마이페이지 · 회원 정보 — 출처: 원본 shop/screens-desktop2.jsx ProfileTab/ProfileRow/PasswordModal
// 현재 사용자(CURRENT_USER) 목업. 수정/비밀번호 변경은 목업 동작.
import { useState, type ReactNode } from 'react'
import { CURRENT_USER } from './current-user'
import { MpField, MpInput, ModalClose, useModalDismiss, mypagePrimaryBtn, mypageGhostBtn, mypageBackdrop, mypageModal, mypageModalHead, mypageModalKicker, mypageModalTitle, mypageModalFoot } from './mypage-ui'

type Me = { id: string; name: string; email: string; phone: string; birth: string; marketing: boolean }

export default function ProfileTab() {
  const [edit, setEdit] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [me, setMe] = useState<Me>({
    id: CURRENT_USER.id,
    name: CURRENT_USER.name,
    email: CURRENT_USER.email,
    phone: CURRENT_USER.phone,
    birth: CURRENT_USER.birth,
    marketing: CURRENT_USER.marketing,
  })
  const setField = <K extends keyof Me>(k: K, v: Me[K]) => setMe((prev) => ({ ...prev, [k]: v }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, color: 'var(--plum-800)' }}>회원 정보</h3>
        {!edit ? (
          <button onClick={() => setEdit(true)} style={mypagePrimaryBtn}>정보 수정</button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEdit(false)} style={mypageGhostBtn}>취소</button>
            <button onClick={() => setEdit(false)} style={mypagePrimaryBtn}>변경 저장</button>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
        <ProfileRow label="아이디" value={me.id} mono />
        <ProfileRow label="이름" value={me.name} editing={edit} onChange={(v) => setField('name', v)} />
        <ProfileRow label="이메일" value={me.email} mono editing={edit} onChange={(v) => setField('email', v)} />
        <ProfileRow label="휴대전화" value={me.phone} mono editing={edit} onChange={(v) => setField('phone', v)} />
        <ProfileRow label="생년월일" value={me.birth} mono editing={edit} onChange={(v) => setField('birth', v)} />
        <ProfileRow label="비밀번호" value="••••••••" mono action={<button onClick={() => setPwOpen(true)} style={mypageGhostBtn}>비밀번호 변경</button>} />
        <ProfileRow
          label="마케팅 수신"
          value={
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
              <input type="checkbox" checked={me.marketing} onChange={(e) => setField('marketing', e.target.checked)} disabled={!edit} />
              이메일 · SMS 수신 동의
            </label>
          }
        />
      </div>

      <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ color: 'var(--muted)', lineHeight: 1.6, maxWidth: 520, width: '550px', fontSize: '12px' }}>
            회원 탈퇴 시 보유하신 포인트와 적립 혜택은 모두 소멸되며, 동일 이메일로 30일간 재가입이 제한됩니다.
          </div>
          <button style={{ ...mypageGhostBtn, color: '#a8322c', borderColor: '#d8b0aa' }}>회원 탈퇴</button>
        </div>
      </div>

      {pwOpen && <PasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  )
}

function ProfileRow({ label, value, mono, editing, onChange, action }: { label: string; value: ReactNode; mono?: boolean; editing?: boolean; onChange?: (v: string) => void; action?: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 24, alignItems: 'center', padding: '18px 28px', borderBottom: '1px solid var(--line)' }}>
      <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10.5, letterSpacing: '0.24em', color: 'var(--muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 14, fontFamily: mono ? 'var(--serif-en)' : 'var(--sans)', color: 'var(--ink)', letterSpacing: mono ? '0.04em' : 0 }}>
        {editing && typeof value === 'string' ? <MpInput mono={mono} value={value} onChange={onChange} /> : value}
      </div>
      <div>{action}</div>
    </div>
  )
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  useModalDismiss(onClose)
  return (
    <div onClick={onClose} style={mypageBackdrop}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onClose() }} style={{ ...mypageModal, width: 'min(480px, 100%)' }}>
        <div style={mypageModalHead}>
          <div>
            <div style={mypageModalKicker}>PASSWORD</div>
            <div style={mypageModalTitle}>비밀번호 변경</div>
          </div>
          <ModalClose onClose={onClose} />
        </div>
        <div style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MpField label="현재 비밀번호"><MpInput mono type="password" placeholder="••••••••" /></MpField>
          <MpField label="새 비밀번호"><MpInput mono type="password" placeholder="••••••••" /></MpField>
          <MpField label="새 비밀번호 확인"><MpInput mono type="password" placeholder="••••••••" /></MpField>
        </div>
        <div style={mypageModalFoot}>
          <button type="button" onClick={onClose} style={mypageGhostBtn}>취소</button>
          <button type="submit" style={mypagePrimaryBtn}>변경하기</button>
        </div>
      </form>
    </div>
  )
}
