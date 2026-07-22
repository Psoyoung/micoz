// 마이페이지 · 배송지 관리 — 출처: 원본 shop/screens-desktop2.jsx AddressTab/AddressFormModal
// 목업. 수령인 기본값은 현재 사용자(CURRENT_USER).
import { useState } from 'react'
import { CURRENT_USER } from './current-user'
import { MpField, MpInput, ModalClose, useModalDismiss, mypagePrimaryBtn, mypageGhostBtn, mypageBackdrop, mypageModal, mypageModalHead, mypageModalKicker, mypageModalTitle, mypageModalFoot } from './mypage-ui'

type AddressForm = { label: string; name: string; phone: string; zip: string; addr: string; detail: string }
type Address = AddressForm & { id: number; isDefault: boolean }

export default function AddressTab() {
  const [addresses, setAddresses] = useState<Address[]>([
    { id: 1, label: '집', name: CURRENT_USER.name, phone: '010-2841-9921', zip: '04781', addr: '서울특별시 성동구 성수이로 89', detail: '미코즈빌딩 4층 (성수동2가)', isDefault: true },
    { id: 2, label: '회사', name: CURRENT_USER.name, phone: '010-2841-9921', zip: '06234', addr: '서울특별시 강남구 테헤란로 142', detail: '캐피탈빌딩 12층', isDefault: false },
  ])
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const remove = (id: number) => setAddresses((prev) => prev.filter((a) => a.id !== id))
  const setDefault = (id: number) => setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, color: 'var(--plum-800)' }}>배송지 관리</h3>
        <button onClick={() => setEditing('new')} style={mypagePrimaryBtn}>새 배송지 추가</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {addresses.map((a) => (
          <div key={a.id} style={{ padding: 24, background: a.isDefault ? '#faf6fc' : 'var(--paper)', border: '1px solid ' + (a.isDefault ? 'var(--plum-700)' : 'var(--line)') }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ padding: '3px 10px', background: a.isDefault ? 'var(--plum-700)' : 'transparent', color: a.isDefault ? 'var(--cream)' : 'var(--plum-700)', border: a.isDefault ? 'none' : '1px solid var(--plum-200)', fontSize: 11, letterSpacing: '0.08em' }}>{a.label}</span>
              {a.isDefault && <span style={{ fontSize: 11, color: 'var(--plum-700)', fontFamily: 'var(--serif-en)', letterSpacing: '0.2em' }}>DEFAULT</span>}
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--plum-800)', marginBottom: 4 }}>{a.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', fontFamily: 'var(--serif-en)', letterSpacing: '0.04em' }}>{a.phone}</div>
            <div style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink)' }}>
              ({a.zip}) {a.addr}
              <br />
              {a.detail}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              <button onClick={() => setEditing(a.id)} style={mypageGhostBtn}>편집</button>
              {!a.isDefault && <button onClick={() => setDefault(a.id)} style={mypageGhostBtn}>기본 배송지로</button>}
              {!a.isDefault && <button onClick={() => remove(a.id)} style={mypageGhostBtn}>삭제</button>}
            </div>
          </div>
        ))}
      </div>

      {editing !== null && (
        <AddressFormModal
          onClose={() => setEditing(null)}
          initial={editing === 'new' ? null : addresses.find((a) => a.id === editing) ?? null}
          onSubmit={(data) => {
            if (editing === 'new') {
              setAddresses((prev) => [...prev, { ...data, id: Date.now(), isDefault: prev.length === 0 }])
            } else {
              setAddresses((prev) => prev.map((a) => (a.id === editing ? { ...a, ...data } : a)))
            }
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function AddressFormModal({ onClose, initial, onSubmit }: { onClose: () => void; initial: Address | null; onSubmit: (data: AddressForm) => void }) {
  const [form, setForm] = useState<AddressForm>(
    initial ?? { label: '집', name: CURRENT_USER.name, phone: '', zip: '', addr: '', detail: '' },
  )
  useModalDismiss(onClose)
  const setField = (k: keyof AddressForm, v: string) => setForm((prev) => ({ ...prev, [k]: v }))
  return (
    <div onClick={onClose} style={mypageBackdrop}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} style={mypageModal}>
        <div style={mypageModalHead}>
          <div>
            <div style={mypageModalKicker}>{initial ? 'EDIT ADDRESS' : 'NEW ADDRESS'}</div>
            <div style={mypageModalTitle}>{initial ? '배송지 편집' : '새 배송지'}</div>
          </div>
          <ModalClose onClose={onClose} />
        </div>
        <div style={{ padding: 26, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          <MpField label="배송지 라벨"><MpInput value={form.label} onChange={(v) => setField('label', v)} placeholder="집, 회사 등" /></MpField>
          <MpField label="수령인"><MpInput value={form.name} onChange={(v) => setField('name', v)} placeholder="이름" /></MpField>
          <MpField label="휴대전화"><MpInput mono value={form.phone} onChange={(v) => setField('phone', v)} placeholder="010-0000-0000" /></MpField>
          <MpField label="우편번호"><MpInput mono value={form.zip} onChange={(v) => setField('zip', v)} placeholder="04781" /></MpField>
          <MpField label="주소" full><MpInput value={form.addr} onChange={(v) => setField('addr', v)} placeholder="기본 주소" /></MpField>
          <MpField label="상세 주소" full><MpInput value={form.detail} onChange={(v) => setField('detail', v)} placeholder="동/호수, 상세 주소" /></MpField>
        </div>
        <div style={mypageModalFoot}>
          <button type="button" onClick={onClose} style={mypageGhostBtn}>취소</button>
          <button type="submit" style={mypagePrimaryBtn}>{initial ? '변경 저장' : '추가하기'}</button>
        </div>
      </form>
    </div>
  )
}
