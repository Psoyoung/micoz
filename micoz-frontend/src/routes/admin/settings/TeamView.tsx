// 관리자 계정 관리 — A3c: mock TEAM → 실 API(F-3 생성 · F-4 목록 · F-5 활성/비활성).
// 보호 가드: 본인 계정 비활성 버튼 사전 차단(self-lockout 방지, 현재 관리자 userSeq = AdminAuthContext).
//   마지막 관리자(ADMIN_LAST_ADMIN_PROTECTED)·ROOT(ADMIN_ROOT_PROTECTED)는 사전 판별 불가 → 409 한글 안내.
// 원본의 역할 티어(슈퍼관리자/운영/MD…)는 API에 없음(ADMIN 단일 + useYn) → 제거.
import { useState, useEffect, type CSSProperties, type FormEvent } from 'react'
import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdminStatus,
  type AdminAccountRow,
} from '../../../api/admin/admins'
import { adminErrorMessage } from '../../../api/admin/errors'
import { useAdminAuth } from '../../../auth/AdminAuthContext'
import Card from '../../../components/admin/Card'
import AdminBtn from '../../../components/admin/AdminBtn'
import Pagination from '../../../components/admin/Pagination'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import { AdminLoading, AdminError, AdminEmpty } from '../../../components/admin/AsyncState'
import { AIcon } from '../../../components/admin/icons'
import { useModalDismiss } from '../../../lib/useModalDismiss'

const pageWrap: CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }
const PAGE_SIZE = 20
const thStyle2: CSSProperties = { padding: '12px 14px', textAlign: 'left', fontWeight: 500, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ad-muted)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }
const tdStyle2: CSSProperties = { padding: '14px 14px', color: 'var(--ad-ink)', verticalAlign: 'middle' }

export default function TeamView() {
  const { admin } = useAdminAuth()
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [statusTarget, setStatusTarget] = useState<AdminAccountRow | null>(null)

  const { data, isLoading, isError, error, refetch, isFetching } = useAdmins({ page: page - 1, size: PAGE_SIZE, sort: 'userSeq,desc' })
  const statusMut = useUpdateAdminStatus()

  const openStatus = (row: AdminAccountRow) => {
    statusMut.reset()
    setStatusTarget(row)
  }

  return (
    <div style={pageWrap}>
      <Card
        title="관리자 · 권한"
        subtitle={data ? `TEAM · ${data.totalElements}명` : 'TEAM'}
        padding={0}
        action={<AdminBtn variant="primary" icon={AIcon.plus(13)} size="sm" onClick={() => setAddOpen(true)}>관리자 등록</AdminBtn>}
      >
        {isLoading ? (
          <AdminLoading label="관리자 목록을 불러오는 중…" />
        ) : isError ? (
          <AdminError error={error} onRetry={refetch} />
        ) : !data || data.rows.length === 0 ? (
          <AdminEmpty label="등록된 관리자가 없습니다" />
        ) : (
          <>
            <div style={{ overflow: 'auto', opacity: isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--ad-paper-2)', borderBottom: '1px solid var(--ad-line)' }}>
                    <th style={{ ...thStyle2, paddingLeft: 22 }}>아이디</th>
                    <th style={thStyle2}>이름</th>
                    <th style={thStyle2}>이메일</th>
                    <th style={thStyle2}>최근 로그인</th>
                    <th style={thStyle2}>상태</th>
                    <th style={{ ...thStyle2, paddingRight: 22, textAlign: 'right' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((m) => {
                    const isSelf = admin?.userSeq === m.userSeq
                    return (
                      <tr key={m.userSeq} style={{ borderBottom: '1px solid var(--ad-line-soft)' }}>
                        <td style={{ ...tdStyle2, paddingLeft: 22, fontFamily: 'var(--mono)', fontSize: 12, color: '#3a2552', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {m.userId}
                          {isSelf && <span style={{ marginLeft: 8, fontSize: 10.5, color: 'var(--ad-muted)', fontFamily: 'var(--sans)' }}>(나)</span>}
                        </td>
                        <td style={{ ...tdStyle2, fontWeight: 500, whiteSpace: 'nowrap' }}>{m.userName}</td>
                        <td style={{ ...tdStyle2, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', fontSize: 11.5 }}>{m.email || '-'}</td>
                        <td style={{ ...tdStyle2, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', fontSize: 11.5, whiteSpace: 'nowrap' }}>{m.lastLoginDate || '-'}</td>
                        <td style={tdStyle2}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: m.active ? '#3a8a5a' : 'var(--ad-muted)', whiteSpace: 'nowrap' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.active ? '#3a8a5a' : '#bbb' }} />
                            {m.activeLabel}
                          </span>
                        </td>
                        <td style={{ ...tdStyle2, paddingRight: 22, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {isSelf ? (
                            <span style={{ fontSize: 11.5, color: 'var(--ad-muted)' }} title="본인 계정은 여기서 비활성화할 수 없습니다">본인 계정</span>
                          ) : m.active ? (
                            <button type="button" onClick={() => openStatus(m)} style={{ padding: '5px 12px', background: '#fff', border: '1px solid #e6c8c1', color: '#8a3a2c', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11.5 }}>비활성화</button>
                          ) : (
                            <button type="button" onClick={() => openStatus(m)} style={{ padding: '5px 12px', background: '#fff', border: '1px solid var(--ad-line-strong)', color: 'var(--ad-ink)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11.5 }}>활성화</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={data.totalElements} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={statusTarget != null}
        title={statusTarget?.active ? '관리자 비활성화' : '관리자 활성화'}
        message={
          statusTarget?.active ? (
            <>'{statusTarget?.userName}({statusTarget?.userId})' 관리자를 <b>비활성화</b>합니다. 비활성화되면 다음 토큰 갱신부터 로그인이 거부됩니다(세션 만료). 계속하시겠습니까?</>
          ) : (
            <>'{statusTarget?.userName}({statusTarget?.userId})' 관리자를 다시 <b>활성화</b>합니다.</>
          )
        }
        confirmLabel={statusTarget?.active ? '비활성화' : '활성화'}
        danger={!!statusTarget?.active}
        busy={statusMut.isPending}
        error={statusMut.error}
        onConfirm={() => statusTarget && statusMut.mutate({ userSeq: statusTarget.userSeq, active: !statusTarget.active }, { onSuccess: () => setStatusTarget(null) })}
        onCancel={() => setStatusTarget(null)}
      />

      <AddAdminModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

// ─── 관리자 등록 모달 (F-3) ───
const fieldStyle: CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid var(--ad-line-strong)', background: '#fff', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ad-ink)', outline: 'none' }
const labelStyle: CSSProperties = { display: 'block', fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', marginBottom: 6, textTransform: 'uppercase' }

function AddAdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [userId, setUserId] = useState('')
  const [userPw, setUserPw] = useState('')
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const createMut = useCreateAdmin()
  useModalDismiss(onClose, open && !createMut.isPending)

  useEffect(() => {
    if (open) {
      setUserId('')
      setUserPw('')
      setUserName('')
      setEmail('')
      createMut.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const canSubmit = userId.trim() && userPw && userName.trim() && !createMut.isPending
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    createMut.mutate(
      { userId: userId.trim(), userPw, userName: userName.trim(), email: email.trim() || undefined },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <div onClick={() => !createMut.isPending && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 10, 28, 0.55)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'modalIn .18s ease' }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} style={{ background: '#fff', width: 'min(540px, 100%)', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', border: '1px solid var(--ad-line-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 26px', borderBottom: '1px solid var(--ad-line)' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.18em', marginBottom: 4 }}>NEW ADMIN</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, color: 'var(--ad-ink)' }}>관리자 등록</div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, background: 'transparent', border: '1px solid var(--ad-line-strong)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ad-ink)' }} title="닫기 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div style={{ padding: 26, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 18px' }}>
          <div>
            <div style={labelStyle}>아이디 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input value={userId} onChange={(e) => setUserId(e.target.value)} style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="micoz_admin" autoComplete="off" required />
          </div>
          <div>
            <div style={labelStyle}>비밀번호 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input type="password" value={userPw} onChange={(e) => setUserPw(e.target.value)} style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="••••••••" autoComplete="new-password" required />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={labelStyle}>이름 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input value={userName} onChange={(e) => setUserName(e.target.value)} style={fieldStyle} placeholder="홍길동" required />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={labelStyle}>이메일</div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="name@micoz.kr" />
          </div>
        </div>

        {createMut.error != null && (
          <div role="alert" style={{ margin: '0 26px', fontSize: 12.5, color: '#8a3a2c' }}>{adminErrorMessage(createMut.error)}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 26px', borderTop: '1px solid var(--ad-line)', background: 'var(--ad-paper-2)', marginTop: 12 }}>
          <AdminBtn onClick={onClose}>취소</AdminBtn>
          <button type="submit" disabled={!canSubmit} style={{ padding: '8px 18px', background: '#3a2552', color: '#f5f1ea', border: '1px solid #3a2552', cursor: canSubmit ? 'pointer' : 'default', fontFamily: 'var(--sans)', fontSize: 12.5, letterSpacing: '0.02em', opacity: canSubmit ? 1 : 0.5 }}>{createMut.isPending ? '등록 중…' : '관리자 등록'}</button>
        </div>
      </form>
    </div>
  )
}
