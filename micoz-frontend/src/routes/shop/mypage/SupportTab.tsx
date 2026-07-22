// 마이페이지 · 1:1 문의 — 출처: 원본 shop/screens-desktop2.jsx SupportTab/SupportFormModal/SupportDetailModal
// 목업. 카드 hover 는 .support-item:hover 로 이관(원본 JS hover). 제출/조회는 목업 동작.
import { useState } from 'react'
import { MpField, MpInput, ModalClose, useModalDismiss, mypagePrimaryBtn, mypageGhostBtn, mypageSelect, mypageBackdrop, mypageModal, mypageModalHead, mypageModalKicker, mypageModalTitle, mypageModalFoot } from './mypage-ui'

type Inquiry = { id: string; subject: string; category: string; date: string; status: string; body: string; answer: string | null }

const CATEGORIES = ['주문 · 배송', '환불 · 교환', '재입고', '제품 · 사용법', '쿠폰 · 프로모션', '회원 · 직급', '기타']

export default function SupportTab() {
  const [items, setItems] = useState<Inquiry[]>([
    { id: 'Q-2641', subject: '비온 에센스 100ml 재입고 일정 문의', category: '재입고', date: '2026.05.20 14:21', status: '대기', body: '안녕하세요, 비온 에센스 100ml이 품절 표시되어 있는데 다음 입고 일정이 언제쯤일지 알 수 있을까요? 알림 신청은 해두었습니다. 감사합니다.', answer: null },
    { id: 'Q-2615', subject: '제린 세럼 사용 후 따끔거림이 있어요', category: '제품 · 사용법', date: '2026.05.10 18:02', status: '답변완료', body: '세럼을 바른 직후 살짝 따끔거리는 느낌이 있는데 정상 반응인지 궁금합니다.', answer: '안녕하세요. 약산성 PHA 5% 포뮬러 특성상 적용 직후 일시적인 자극감이 있을 수 있으며 1~2분 내 가라앉습니다. 지속될 경우 토너 단계에서 충분히 결을 정돈한 뒤 사용을 권장드립니다.' },
    { id: 'Q-2589', subject: 'VIP 등급 혜택을 정리해서 알 수 있을까요', category: '회원 · 직급', date: '2026.04.22 09:48', status: '답변완료', body: '마스터 등급에서 받을 수 있는 혜택을 정리해 알려주시면 감사하겠습니다.', answer: '마스터 등급은 적립률 5%, 무료배송, 신상 우선 알림 등의 혜택이 제공됩니다.' },
  ])
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<Inquiry | null>(null)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, color: 'var(--plum-800)' }}>1:1 문의</h3>
        <button onClick={() => setOpen(true)} style={mypagePrimaryBtn}>새 문의 작성</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', background: 'var(--paper)', border: '1px solid var(--line)', color: 'var(--muted)', fontSize: 14 }}>접수된 문의가 없습니다.</div>
        )}
        {items.map((q) => {
          const isDone = q.status === '답변완료'
          return (
            <button
              key={q.id}
              className="support-item"
              onClick={() => setView(q)}
              style={{ all: 'unset', cursor: 'pointer', display: 'block', padding: '22px 26px', background: 'var(--paper)', border: '1px solid var(--line)', transition: 'border-color .15s' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--serif-en)', fontSize: 12, color: 'var(--plum-700)', letterSpacing: '0.06em' }}>{q.id}</span>
                <span style={{ fontSize: 11, padding: '3px 10px', background: isDone ? 'var(--plum-100)' : 'transparent', border: isDone ? 'none' : '1px solid var(--line-strong)', color: isDone ? 'var(--plum-700)' : 'var(--muted)', letterSpacing: '0.06em' }}>{q.status}</span>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--plum-800)', fontWeight: 500 }}>{q.subject}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 14 }}>
                <span>{q.category}</span>
                <span style={{ fontFamily: 'var(--serif-en)', letterSpacing: '0.04em' }}>{q.date}</span>
              </div>
            </button>
          )
        })}
      </div>

      {open && (
        <SupportFormModal
          categories={CATEGORIES}
          onClose={() => setOpen(false)}
          onSubmit={(data) => {
            const id = 'Q-' + Math.floor(2700 + Math.random() * 100)
            const now = new Date()
            const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
            setItems((prev) => [{ id, status: '대기', date, answer: null, ...data }, ...prev])
            setOpen(false)
          }}
        />
      )}
      {view && <SupportDetailModal inquiry={view} onClose={() => setView(null)} />}
    </div>
  )
}

type FormData = { category: string; subject: string; body: string }

function SupportFormModal({ categories, onClose, onSubmit }: { categories: string[]; onClose: () => void; onSubmit: (data: FormData) => void }) {
  const [form, setForm] = useState<FormData>({ category: categories[0], subject: '', body: '' })
  useModalDismiss(onClose)
  const setField = (k: keyof FormData, v: string) => setForm((prev) => ({ ...prev, [k]: v }))
  return (
    <div onClick={onClose} style={mypageBackdrop}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.subject || !form.body) return
          onSubmit(form)
        }}
        style={{ ...mypageModal, width: 'min(620px, 100%)' }}
      >
        <div style={mypageModalHead}>
          <div>
            <div style={mypageModalKicker}>NEW INQUIRY</div>
            <div style={mypageModalTitle}>새 문의 작성</div>
          </div>
          <ModalClose onClose={onClose} />
        </div>
        <div style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MpField label="문의 유형">
            <select value={form.category} onChange={(e) => setField('category', e.target.value)} style={mypageSelect}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </MpField>
          <MpField label="제목"><MpInput value={form.subject} onChange={(v) => setField('subject', v)} placeholder="예: 환불 처리 진행 상황 문의" /></MpField>
          <MpField label="내용">
            <textarea
              value={form.body}
              onChange={(e) => setField('body', e.target.value)}
              placeholder="문의 내용을 상세히 입력해주세요"
              style={{ width: '100%', minHeight: 160, padding: '12px 14px', border: '1px solid var(--line-strong)', background: 'var(--paper)', fontFamily: 'var(--sans)', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink)', outline: 'none', resize: 'vertical' }}
            />
          </MpField>
        </div>
        <div style={mypageModalFoot}>
          <button type="button" onClick={onClose} style={mypageGhostBtn}>취소</button>
          <button type="submit" style={mypagePrimaryBtn}>접수하기</button>
        </div>
      </form>
    </div>
  )
}

function SupportDetailModal({ inquiry, onClose }: { inquiry: Inquiry; onClose: () => void }) {
  useModalDismiss(onClose)
  return (
    <div onClick={onClose} style={mypageBackdrop}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...mypageModal, width: 'min(680px, 100%)' }}>
        <div style={mypageModalHead}>
          <div style={{ minWidth: 0 }}>
            <div style={mypageModalKicker}>INQUIRY · {inquiry.id}</div>
            <div style={mypageModalTitle}>{inquiry.subject}</div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 14 }}>
              <span>{inquiry.category}</span>
              <span style={{ fontFamily: 'var(--serif-en)', letterSpacing: '0.04em' }}>{inquiry.date}</span>
              <span style={{ fontSize: 11, padding: '2px 10px', background: inquiry.status === '답변완료' ? 'var(--plum-100)' : 'transparent', border: inquiry.status === '답변완료' ? 'none' : '1px solid var(--line-strong)', color: inquiry.status === '답변완료' ? 'var(--plum-700)' : 'var(--muted)' }}>{inquiry.status}</span>
            </div>
          </div>
          <ModalClose onClose={onClose} />
        </div>
        <div style={{ padding: 26 }}>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.28em', color: 'var(--muted)', marginBottom: 10 }}>QUESTION</div>
          <div style={{ padding: 20, background: '#faf7fc', border: '1px solid var(--line)', fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{inquiry.body}</div>

          {inquiry.answer ? (
            <>
              <div style={{ marginTop: 24, fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.28em', color: 'var(--plum-700)', marginBottom: 10 }}>ANSWER · MICOZ</div>
              <div style={{ padding: 20, background: 'var(--paper)', border: '1px solid var(--plum-200)', fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{inquiry.answer}</div>
            </>
          ) : (
            <div style={{ marginTop: 24, padding: 18, border: '1px dashed var(--line-strong)', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>담당자가 확인 중입니다. 영업일 기준 24시간 이내에 답변드립니다.</div>
          )}
        </div>
        <div style={mypageModalFoot}>
          <button type="button" onClick={onClose} style={mypagePrimaryBtn}>닫기</button>
        </div>
      </div>
    </div>
  )
}
