// 관리자 회원관리 — A2: mock MEMBERS → 실 API(M-1 목록 · M-3 상세) + A3a: 변이(M-2 등록 · M-4 등급 · M-5 상태 · M-6 포인트).
// [A2 레퍼런스] 서버 위임 페이징·검색·필터 + 로딩/에러/빈상태 + 매퍼(api/admin/members.ts). 클라 필터 제거.
// 매퍼 갭(계획 빚#7): 이메일·전화는 목록 미제공(상세에서), 주문수·누적구매액·최근주문은 집계 미제공(백엔드 빚) → 컬럼 제외.
// M-7(역할변경)은 A3c(관리자계정) 범위 — 이 파일에 미구현.
import { useState, useEffect, type CSSProperties, type FormEvent } from 'react'
import {
  useMembers,
  useMember,
  useCreateMember,
  useUpdateMemberGrade,
  useUpdateMemberStatus,
  useAdjustMemberPoints,
  useUpdateMemberRole,
  type AdminMemberRow,
} from '../../../api/admin/members'
import { ADMIN_GRADE_LABEL, ADMIN_MEMBER_STATUS_LABEL } from '../../../api/admin/labels'
import { adminErrorMessage } from '../../../api/admin/errors'
import { useAdminAuth } from '../../../auth/AdminAuthContext'
import ConfirmDialog from '../../../components/admin/ConfirmDialog'
import Card from '../../../components/admin/Card'
import { FilterBar } from '../../../components/admin/filters'
import AdminDropdown from '../../../components/admin/AdminDropdown'
import AdminBtn from '../../../components/admin/AdminBtn'
import DataTable, { type Column } from '../../../components/admin/DataTable'
import Pagination from '../../../components/admin/Pagination'
import { GradeChip, StatusChip } from '../../../components/admin/chips'
import KVCol from '../../../components/admin/KVCol'
import { AIcon } from '../../../components/admin/icons'
import { AdminLoading, AdminError, AdminEmpty } from '../../../components/admin/AsyncState'
import { useModalDismiss } from '../../../lib/useModalDismiss'

const pageWrap: CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }
const PAGE_SIZE = 20

const GRADE_OPTS = [{ k: 'all', l: '전체 등급' }, ...Object.entries(ADMIN_GRADE_LABEL).map(([k, l]) => ({ k, l }))]
const STATUS_OPTS = [{ k: 'all', l: '전체 상태' }, ...Object.entries(ADMIN_MEMBER_STATUS_LABEL).map(([k, l]) => ({ k, l }))]

// 검색어 디바운스(서버 요청 절약) — 타이핑 멈춘 뒤 400ms.
function useDebounced<T>(value: T, delay = 400): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

const columns: Column<AdminMemberRow>[] = [
  { key: 'userId', label: '회원ID', mono: true, nowrap: true, render: (v) => <span style={{ color: '#3a2552', fontWeight: 500 }}>{v as string}</span> },
  { key: 'userName', label: '이름', render: (v) => <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{v as string}</span> },
  { key: 'gradeLabel', label: '등급', render: (v) => <GradeChip grade={v as string} /> },
  { key: 'pointBalance', label: '포인트', align: 'right', mono: true, nowrap: true, render: (v) => (v as number).toLocaleString() + 'P' },
  { key: 'statusLabel', label: '상태', render: (_v, r) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <StatusChip status={r.statusLabel} />
      {r.useYn === 'N' && <span style={{ fontSize: 10.5, color: '#a85050', fontFamily: 'var(--mono)' }}>탈퇴</span>}
    </span>
  ) },
  { key: 'joinedDate', label: '가입일', mono: true, muted: true, nowrap: true },
  { key: 'lastLoginDate', label: '최근 로그인', mono: true, muted: true, nowrap: true, render: (v) => (v as string) || '-' },
]

export default function MembersView() {
  const [grade, setGrade] = useState('all')
  const [status, setStatus] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1) // 1-based UI
  const [addOpen, setAddOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const q = useDebounced(searchInput.trim())

  // 필터/검색 변경 시 1페이지로.
  useEffect(() => { setPage(1) }, [grade, status, q])

  const { data, isLoading, isError, error, refetch, isFetching } = useMembers({
    q: q || undefined,
    gradeCode: grade !== 'all' ? grade : undefined,
    status: status !== 'all' ? status : undefined,
    page: page - 1, // 0-based
    size: PAGE_SIZE,
    sort: 'userSeq,desc',
  })

  return (
    <div style={pageWrap}>
      <Card padding={0}>
        <FilterBar
          action={
            <AdminBtn icon={AIcon.plus(13)} size="sm" variant="primary" onClick={() => setAddOpen(true)}>회원 추가</AdminBtn>
          }
        >
          <AdminDropdown value={grade} onChange={setGrade} options={GRADE_OPTS} width={160} />
          <AdminDropdown value={status} onChange={setStatus} options={STATUS_OPTS} width={150} />
          <span style={{ width: 1, height: 22, background: 'var(--ad-line)', margin: '0 4px' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fff', border: '1px solid var(--ad-line-strong)', width: 280 }}>
            <span style={{ color: 'var(--ad-muted)', display: 'flex' }}>{AIcon.search(14)}</span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="회원 ID · 이름 검색"
              style={{ border: 'none', outline: 'none', flex: 1, background: 'transparent', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ad-ink)', minWidth: 0 }}
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ad-muted)', display: 'flex', padding: 0 }} title="검색어 지우기">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            )}
          </div>
        </FilterBar>

        {isLoading ? (
          <AdminLoading label="회원 목록을 불러오는 중…" />
        ) : isError ? (
          <AdminError error={error} onRetry={refetch} />
        ) : !data || data.rows.length === 0 ? (
          <AdminEmpty label="조건에 맞는 회원이 없습니다" />
        ) : (
          <>
            <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
              <DataTable columns={columns} rows={data.rows} rowKey="userSeq" onRowClick={(r) => setDetailId(r.userSeq)} />
            </div>
            <Pagination page={page} total={data.totalElements} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </Card>

      <MemberDetailModal userSeq={detailId} onClose={() => setDetailId(null)} />
      <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

// ─── 회원 상세 모달 (M-3 조회 + M-4/M-5/M-6 관리 액션) ───
function MemberDetailModal({ userSeq, onClose }: { userSeq: number | null; onClose: () => void }) {
  useModalDismiss(onClose, userSeq != null)
  const { data, isLoading, isError, error, refetch } = useMember(userSeq)
  if (userSeq == null) return null

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 10, 28, 0.55)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'modalIn .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: 'min(720px, 100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', border: '1px solid var(--ad-line-strong)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 26px', borderBottom: '1px solid var(--ad-line)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.18em', marginBottom: 4 }}>MEMBER DETAIL</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500 }}>{data ? `${data.userName} (${data.userId})` : '회원 상세'}</div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, background: 'transparent', border: '1px solid var(--ad-line-strong)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="닫기 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div style={{ padding: 26, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {isLoading ? (
            <AdminLoading label="회원 정보를 불러오는 중…" />
          ) : isError ? (
            <AdminError error={error} onRetry={refetch} />
          ) : data ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, fontSize: 12 }}>
                <KVCol label="등급" value={data.gradeLabel} />
                <KVCol label="상태" value={data.statusLabel + (data.useYn === 'N' ? ' · 탈퇴' : '')} />
                <KVCol label="역할" value={data.userRole} />
                <KVCol label="포인트" value={data.pointBalance.toLocaleString() + 'P'} mono />
                <KVCol label="이메일" value={data.email || '-'} mono />
                <KVCol label="전화" value={data.phone || '-'} mono />
                <KVCol label="생년월일" value={data.birthDate || '-'} mono />
                <KVCol label="마케팅 수신" value={data.marketingYn === 'Y' ? '동의' : '미동의'} />
                <KVCol label="추천인" value={data.referrerUserId || '-'} mono />
                <KVCol label="가입일시" value={data.joinedDate} mono />
                <KVCol label="최근 로그인" value={data.lastLoginDate || '-'} mono />
                <div style={{ gridColumn: '1 / -1' }}><KVCol label="주소" value={data.address || '-'} /></div>
                {data.memo && <div style={{ gridColumn: '1 / -1' }}><KVCol label="메모" value={data.memo} /></div>}
              </div>

              <MemberActions userSeq={data.userSeq} gradeCode={data.gradeCode} userStatus={data.userStatus} pointBalance={data.pointBalance} userRole={data.userRole} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── 관리 액션(M-4 등급 · M-5 상태 · M-6 포인트) — 상세 모달 하단 ───
const sectionLabel: CSSProperties = { fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase' }
const actionRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }
const inlineError: CSSProperties = { fontSize: 12, color: '#8a3a2c', background: '#fbece9', border: '1px solid #e6c8c1', padding: '6px 10px', width: '100%' }

const GRADE_CODE_OPTS = Object.entries(ADMIN_GRADE_LABEL).map(([k, l]) => ({ k, l }))
const STATUS_CODE_OPTS = Object.entries(ADMIN_MEMBER_STATUS_LABEL).map(([k, l]) => ({ k, l }))

function MemberActions({ userSeq, gradeCode, userStatus, pointBalance, userRole }: { userSeq: number; gradeCode: string; userStatus: string; pointBalance: number; userRole: string }) {
  const { admin } = useAdminAuth()
  const isSelf = admin?.userSeq === userSeq
  const [gradeSel, setGradeSel] = useState(gradeCode)
  const [statusSel, setStatusSel] = useState(userStatus)
  const [pointAmount, setPointAmount] = useState('')
  const [pointReason, setPointReason] = useState('')
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false)

  useEffect(() => setGradeSel(gradeCode), [gradeCode])
  useEffect(() => setStatusSel(userStatus), [userStatus])

  const gradeMut = useUpdateMemberGrade(userSeq)
  const statusMut = useUpdateMemberStatus(userSeq)
  const pointMut = useAdjustMemberPoints(userSeq)
  const roleMut = useUpdateMemberRole(userSeq)
  const targetRole = userRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN'
  const isPromote = targetRole === 'ADMIN'

  const amountNum = Number(pointAmount)
  const pointValid = pointAmount.trim() !== '' && Number.isFinite(amountNum) && amountNum !== 0 && pointReason.trim() !== ''

  return (
    <>
    <div style={{ borderTop: '1px solid var(--ad-line)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={sectionLabel}>등급 변경</div>
        <div style={actionRow}>
          <AdminDropdown value={gradeSel} onChange={setGradeSel} options={GRADE_CODE_OPTS} width={160} />
          <AdminBtn
            size="sm"
            variant="primary"
            onClick={() => gradeMut.mutate({ gradeCode: gradeSel })}
            style={gradeMut.isPending || gradeSel === gradeCode ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
          >
            {gradeMut.isPending ? '저장 중…' : '등급 저장'}
          </AdminBtn>
          {gradeMut.isError && <div style={inlineError}>{adminErrorMessage(gradeMut.error)}</div>}
        </div>
      </div>

      <div>
        <div style={sectionLabel}>상태 변경</div>
        <div style={actionRow}>
          <AdminDropdown value={statusSel} onChange={setStatusSel} options={STATUS_CODE_OPTS} width={140} />
          <AdminBtn
            size="sm"
            variant="primary"
            onClick={() => statusMut.mutate({ status: statusSel })}
            style={statusMut.isPending || statusSel === userStatus ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
          >
            {statusMut.isPending ? '저장 중…' : '상태 저장'}
          </AdminBtn>
          {statusMut.isError && <div style={inlineError}>{adminErrorMessage(statusMut.error)}</div>}
        </div>
      </div>

      <div>
        <div style={sectionLabel}>포인트 조정 (현재 {pointBalance.toLocaleString()}P{pointMut.data ? ` → 조정 후 ${pointMut.data.pointBalance.toLocaleString()}P` : ''})</div>
        <div style={actionRow}>
          <input
            type="number"
            value={pointAmount}
            onChange={(e) => setPointAmount(e.target.value)}
            placeholder="금액 (+적립 / -차감)"
            style={{ width: 160, padding: '7px 10px', border: '1px solid var(--ad-line-strong)', fontFamily: 'var(--mono)', fontSize: 12.5, outline: 'none' }}
          />
          <input
            value={pointReason}
            onChange={(e) => setPointReason(e.target.value)}
            placeholder="사유"
            style={{ flex: 1, minWidth: 160, padding: '7px 10px', border: '1px solid var(--ad-line-strong)', fontFamily: 'var(--sans)', fontSize: 12.5, outline: 'none' }}
          />
          <AdminBtn
            size="sm"
            variant="primary"
            onClick={() => {
              pointMut.mutate(
                { amount: amountNum, reason: pointReason.trim() },
                { onSuccess: () => { setPointAmount(''); setPointReason('') } },
              )
            }}
            style={!pointValid || pointMut.isPending ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
          >
            {pointMut.isPending ? '처리 중…' : '포인트 적용'}
          </AdminBtn>
          {pointMut.isError && <div style={inlineError}>{adminErrorMessage(pointMut.error)}</div>}
        </div>
      </div>

      <div>
        <div style={sectionLabel}>역할 변경 (현재 {userRole})</div>
        {isSelf ? (
          <div style={{ fontSize: 12, color: 'var(--ad-muted)' }}>본인 계정의 역할은 여기서 변경할 수 없습니다(self-lockout 방지).</div>
        ) : (
          <div style={actionRow}>
            <span style={{ fontSize: 12.5 }}>{userRole} → <b>{targetRole}</b> {isPromote ? '(관리자 승격)' : '(일반 회원 강등)'}</span>
            <AdminBtn size="sm" variant={isPromote ? 'primary' : 'danger'} onClick={() => { roleMut.reset(); setRoleConfirmOpen(true) }}>
              {isPromote ? '관리자로 승격' : '일반 회원으로 강등'}
            </AdminBtn>
            {roleMut.isError && <div style={inlineError}>{adminErrorMessage(roleMut.error)}</div>}
          </div>
        )}
      </div>
    </div>

    <ConfirmDialog
      open={roleConfirmOpen}
      title="역할 변경"
      message={isPromote
        ? <>이 회원을 <b>관리자(ADMIN)</b>로 승격합니다. 승격 시 회원 등급이 제거되고 관리자 백오피스에 접근할 수 있게 됩니다. 계속하시겠습니까?</>
        : <>이 관리자를 <b>일반 회원(CUSTOMER)</b>으로 강등합니다. 강등 시 관리자 접근이 제거되고 기본(MEMBER) 등급이 부여됩니다. 계속하시겠습니까?</>}
      confirmLabel={isPromote ? '관리자 승격' : '회원 강등'}
      danger={!isPromote}
      busy={roleMut.isPending}
      error={roleMut.error}
      onConfirm={() => roleMut.mutate(targetRole, { onSuccess: () => setRoleConfirmOpen(false) })}
      onCancel={() => setRoleConfirmOpen(false)}
    />
    </>
  )
}

// ─── 회원 추가 모달 (M-2) ───
const fieldStyle: CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid var(--ad-line-strong)', background: '#fff', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ad-ink)', outline: 'none' }
const labelStyle: CSSProperties = { display: 'block', fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', marginBottom: 6, textTransform: 'uppercase' }

const NEW_MEMBER_GRADE_OPTS = Object.entries(ADMIN_GRADE_LABEL).map(([k, l]) => ({ k, l }))

function AddMemberModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [userId, setUserId] = useState('')
  const [userPw, setUserPw] = useState('')
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gradeCode, setGradeCode] = useState('MEMBER')
  useModalDismiss(onClose, open)

  const createMut = useCreateMember()

  if (!open) return null

  const valid = userId.trim() !== '' && userPw.trim() !== '' && userName.trim() !== ''

  function reset() {
    setUserId('')
    setUserPw('')
    setUserName('')
    setEmail('')
    setPhone('')
    setGradeCode('MEMBER')
    createMut.reset()
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!valid || createMut.isPending) return
    createMut.mutate(
      { userId: userId.trim(), userPw, userName: userName.trim(), gradeCode, email: email.trim() || undefined, phone: phone.trim() || undefined },
      { onSuccess: () => { reset(); onClose() } },
    )
  }

  return (
    <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 10, 28, 0.55)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'modalIn .18s ease' }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={{ background: '#fff', width: 'min(560px, 100%)', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)', border: '1px solid var(--ad-line-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 26px', borderBottom: '1px solid var(--ad-line)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.18em', marginBottom: 4 }}>NEW MEMBER</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, color: 'var(--ad-ink)' }}>회원 추가</div>
          </div>
          <button type="button" onClick={handleClose} style={{ width: 32, height: 32, background: 'transparent', border: '1px solid var(--ad-line-strong)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ad-ink)', flexShrink: 0 }} title="닫기 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div style={{ padding: 26, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 18px' }}>
          <div>
            <div style={labelStyle}>아이디 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input value={userId} onChange={(e) => setUserId(e.target.value)} style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="micoz_id" autoComplete="off" required />
          </div>
          <div>
            <div style={labelStyle}>비밀번호 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input type="password" value={userPw} onChange={(e) => setUserPw(e.target.value)} style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="••••••••" autoComplete="new-password" required />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={labelStyle}>이름 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input value={userName} onChange={(e) => setUserName(e.target.value)} style={fieldStyle} placeholder="홍길동" required />
          </div>
          <div>
            <div style={labelStyle}>이메일</div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="name@example.com" />
          </div>
          <div>
            <div style={labelStyle}>전화번호</div>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="010-0000-0000" />
          </div>
          <div>
            <div style={labelStyle}>등급</div>
            <select value={gradeCode} onChange={(e) => setGradeCode(e.target.value)} style={fieldStyle}>
              {NEW_MEMBER_GRADE_OPTS.map((g) => (<option key={g.k} value={g.k}>{g.l}</option>))}
            </select>
          </div>
          {createMut.isError && (
            <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: '#8a3a2c', background: '#fbece9', border: '1px solid #e6c8c1', padding: '10px 12px' }} role="alert">
              {adminErrorMessage(createMut.error)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 26px', borderTop: '1px solid var(--ad-line)', background: 'var(--ad-paper-2)' }}>
          <AdminBtn onClick={handleClose} style={createMut.isPending ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>취소</AdminBtn>
          <button
            type="submit"
            disabled={!valid || createMut.isPending}
            style={{ padding: '8px 18px', background: '#3a2552', color: '#f5f1ea', border: '1px solid #3a2552', cursor: !valid || createMut.isPending ? 'default' : 'pointer', opacity: !valid || createMut.isPending ? 0.6 : 1, fontFamily: 'var(--sans)', fontSize: 12.5, letterSpacing: '0.02em' }}
          >
            {createMut.isPending ? '저장 중…' : '회원 추가'}
          </button>
        </div>
      </form>
    </div>
  )
}
