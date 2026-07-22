// 관리자 배송비 정책 설정 — A3a: mock 인라인 값 → 실 API(S-7 조회 · S-8 수정). mst_shipping 단일행.
// 원본 admin/admin-views-2.jsx SettingsShipping(:1936)/SettingRow/SettingFooter 레이아웃 보존.
// FormFields(Input/Select/Textarea)는 미제어(내부 seed state)라 서버값 재동기화·저장에 못 씀 → 이 화면은 controlled input 직접 사용(TeamView.tsx AddAdminModal 패턴 따름).
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useShippingSetting, useUpdateShipping } from '../../../api/admin/shipping'
import { adminErrorMessage } from '../../../api/admin/errors'
import Card from '../../../components/admin/Card'
import AdminBtn from '../../../components/admin/AdminBtn'
import { AdminLoading, AdminError } from '../../../components/admin/AsyncState'

const pageWrap: CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }
const fieldStyle: CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid var(--ad-line-strong)', background: '#fff', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ad-ink)', outline: 'none' }

type FormState = {
  shippingName: string
  shippingFee: string
  freeShippingMin: string
  remoteExtraFee: string
  shippingNotice: string
}

export default function ShippingView() {
  const { data, isLoading, isError, error, refetch } = useShippingSetting()
  const updateMutation = useUpdateShipping()

  const [form, setForm] = useState<FormState | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // 조회 성공(및 저장 후 invalidate → 재조회) 시 폼을 서버 값으로 재동기화.
  useEffect(() => {
    if (!data) return
    setForm({
      shippingName: data.shippingName,
      shippingFee: String(data.shippingFee),
      freeShippingMin: String(data.freeShippingMin),
      remoteExtraFee: String(data.remoteExtraFee),
      shippingNotice: data.shippingNotice,
    })
  }, [data])

  function setAmount(key: 'shippingFee' | 'freeShippingMin' | 'remoteExtraFee', raw: string) {
    // 음수 입력 방지(클라단 1차 방어 — 최종 검증은 서버 COMMON_VALIDATION_ERROR).
    if (raw !== '' && (raw.includes('-') || Number(raw) < 0)) return
    setForm((f) => (f ? { ...f, [key]: raw } : f))
  }

  function handleCancel() {
    if (!data) return
    setForm({
      shippingName: data.shippingName,
      shippingFee: String(data.shippingFee),
      freeShippingMin: String(data.freeShippingMin),
      remoteExtraFee: String(data.remoteExtraFee),
      shippingNotice: data.shippingNotice,
    })
    setErrorMsg(null)
    setSaved(false)
  }

  function handleSave() {
    if (!form || updateMutation.isPending) return
    const shippingFee = Number(form.shippingFee)
    const freeShippingMin = Number(form.freeShippingMin)
    const remoteExtraFee = Number(form.remoteExtraFee)
    if (![shippingFee, freeShippingMin, remoteExtraFee].every((n) => Number.isFinite(n) && n >= 0)) {
      setErrorMsg('배송비 금액은 0 이상의 숫자여야 합니다.')
      return
    }
    setErrorMsg(null)
    setSaved(false)
    updateMutation.mutate(
      {
        shippingName: form.shippingName,
        shippingFee,
        freeShippingMin,
        remoteExtraFee,
        shippingNotice: form.shippingNotice,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (err) => setErrorMsg(adminErrorMessage(err)),
      },
    )
  }

  return (
    <div style={pageWrap}>
      <Card title="배송 설정" subtitle="SHIPPING" padding={22}>
        {isLoading ? (
          <AdminLoading label="배송 설정을 불러오는 중…" />
        ) : isError ? (
          <AdminError error={error} onRetry={refetch} />
        ) : form && data ? (
          <>
            <SettingRow label="기본 배송사">
              <input style={fieldStyle} value={form.shippingName} onChange={(e) => setForm({ ...form, shippingName: e.target.value })} />
            </SettingRow>
            <SettingRow label="기본 배송비">
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...fieldStyle, width: 140, fontFamily: 'var(--mono)' }} type="number" min={0} value={form.shippingFee} onChange={(e) => setAmount('shippingFee', e.target.value)} />
                <span style={{ alignSelf: 'center', color: 'var(--ad-muted)', fontSize: 12 }}>원</span>
              </div>
            </SettingRow>
            <SettingRow label="무료배송 기준" hint="해당 금액 이상 주문 시 배송비 0원 (0 = 항상 무료)">
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...fieldStyle, width: 140, fontFamily: 'var(--mono)' }} type="number" min={0} value={form.freeShippingMin} onChange={(e) => setAmount('freeShippingMin', e.target.value)} />
                <span style={{ alignSelf: 'center', color: 'var(--ad-muted)', fontSize: 12 }}>원 이상</span>
              </div>
            </SettingRow>
            <SettingRow label="제주 · 도서산간 추가">
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...fieldStyle, width: 140, fontFamily: 'var(--mono)' }} type="number" min={0} value={form.remoteExtraFee} onChange={(e) => setAmount('remoteExtraFee', e.target.value)} />
                <span style={{ alignSelf: 'center', color: 'var(--ad-muted)', fontSize: 12 }}>원 추가</span>
              </div>
            </SettingRow>
            <SettingRow label="출고일 안내">
              <textarea style={{ ...fieldStyle, minHeight: 72, resize: 'vertical', lineHeight: 1.6 }} value={form.shippingNotice} onChange={(e) => setForm({ ...form, shippingNotice: e.target.value })} />
            </SettingRow>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)' }}>
              <span>최근 수정: {data.updatedAt || '-'} {data.updatedBy && `· ${data.updatedBy}`}</span>
              {saved && !updateMutation.isPending && <span style={{ color: '#3a8a5a' }}>저장됨</span>}
            </div>

            {errorMsg && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: '#fbf0ee', border: '1px solid #e6c8c1', color: '#8a3a2c', fontSize: 12.5, lineHeight: 1.6 }}>{errorMsg}</div>
            )}

            <SettingFooter onCancel={handleCancel} onSave={handleSave} pending={updateMutation.isPending} />
          </>
        ) : null}
      </Card>
    </div>
  )
}

// ─── 설정 행 / 푸터 (colocate — 배송 설정에서만 사용) ───
function SettingRow({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, padding: '14px 0', borderBottom: '1px solid var(--ad-line-soft)', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ad-ink)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: 'var(--ad-muted)', marginTop: 4, lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function SettingFooter({ onCancel, onSave, pending }: { onCancel: () => void; onSave: () => void; pending: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 18, marginTop: 8, borderTop: '1px solid var(--ad-line)' }}>
      <AdminBtn onClick={onCancel} style={pending ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>취소</AdminBtn>
      <AdminBtn variant="primary" onClick={onSave} style={pending ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>
        {pending ? '저장 중…' : '변경 저장'}
      </AdminBtn>
    </div>
  )
}
