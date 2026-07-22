// 관리자 상태/직급 칩 — 출처: 원본 admin/admin-primitives.jsx StatusChip/GradeChip
// 칩 색은 원본 하드코딩 팔레트 보존(토큰 외 프레젠테이션 색). 한글 라벨 기준.

const STATUS_STYLES: Record<string, { bg: string; fg: string; dot: string }> = {
  판매중: { bg: '#eaf4ee', fg: '#2d6a44', dot: '#3a8a5a' },
  판매중지: { bg: '#f1eef5', fg: '#6b5d72', dot: '#9a8fa6' },
  재고부족: { bg: '#fbf1e8', fg: '#8a5a1c', dot: '#c08a3a' },
  품절: { bg: '#fbece9', fg: '#8a3a2c', dot: '#c14d4d' },
  결제완료: { bg: '#eaf4ee', fg: '#2d6a44', dot: '#3a8a5a' },
  입금대기: { bg: '#fbf1e8', fg: '#8a5a1c', dot: '#c08a3a' },
  취소: { bg: '#f4eaea', fg: '#7a3a3a', dot: '#a85050' },
  환불: { bg: '#fbece9', fg: '#8a3a2c', dot: '#c14d4d' },
  활성: { bg: '#eaf4ee', fg: '#2d6a44', dot: '#3a8a5a' },
  휴면: { bg: '#f1eef5', fg: '#6b5d72', dot: '#9a8fa6' },
  탈퇴신청: { bg: '#fbece9', fg: '#8a3a2c', dot: '#c14d4d' },
  준비중: { bg: '#f1edf7', fg: '#4d3470', dot: '#6b4d8f' },
  배송중: { bg: '#e8eef7', fg: '#2a4d8a', dot: '#3a6dbf' },
  배송완료: { bg: '#eaf4ee', fg: '#2d6a44', dot: '#3a8a5a' },
  대기: { bg: '#f1eef5', fg: '#6b5d72', dot: '#9a8fa6' },
  진행중: { bg: '#fdf3e3', fg: '#7a5a1a', dot: '#c08a3a' },
  답변완료: { bg: '#eaf4ee', fg: '#2d6a44', dot: '#3a8a5a' },
  반품완료: { bg: '#f4eaea', fg: '#7a3a3a', dot: '#a85050' },
  // 반품·교환 처리 상태
  신청: { bg: '#fbf1e8', fg: '#8a5a1c', dot: '#c08a3a' },
  승인: { bg: '#f1edf7', fg: '#4d3470', dot: '#6b4d8f' },
  회수중: { bg: '#e8eef7', fg: '#2a4d8a', dot: '#3a6dbf' },
  검수중: { bg: '#fdf3e3', fg: '#7a5a1a', dot: '#c08a3a' },
  완료: { bg: '#eaf4ee', fg: '#2d6a44', dot: '#3a8a5a' },
  반려: { bg: '#f4eaea', fg: '#7a3a3a', dot: '#a85050' },
  // ─── admin_api.md §2 라벨(관리자 연동 A2~) ───
  정상: { bg: '#eaf4ee', fg: '#2d6a44', dot: '#3a8a5a' },
  정지: { bg: '#fbece9', fg: '#8a3a2c', dot: '#c14d4d' },
  결제대기: { bg: '#fbf1e8', fg: '#8a5a1c', dot: '#c08a3a' },
  반품: { bg: '#f4eaea', fg: '#7a3a3a', dot: '#a85050' },
  출고준비: { bg: '#f1edf7', fg: '#4d3470', dot: '#6b4d8f' },
  출고됨: { bg: '#e8eef7', fg: '#2a4d8a', dot: '#3a6dbf' },
  회수완료: { bg: '#e8eef7', fg: '#2a4d8a', dot: '#3a6dbf' },
  검수완료: { bg: '#fdf3e3', fg: '#7a5a1a', dot: '#c08a3a' },
  답변대기: { bg: '#f1eef5', fg: '#6b5d72', dot: '#9a8fa6' },
}

export function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || { bg: '#eee', fg: '#333', dot: '#666' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px 3px 8px',
        background: s.bg,
        color: s.fg,
        fontSize: 11.5,
        fontFamily: 'var(--sans)',
        fontWeight: 500,
        letterSpacing: '0.02em',
        borderRadius: 2,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
      {status}
    </span>
  )
}

const GRADE_STYLES: Record<string, { bg: string; fg: string }> = {
  전무: { bg: '#3a2552', fg: '#f5edf7' },
  상무: { bg: '#6b4d8f', fg: '#f5edf7' },
  마스터: { bg: '#b89968', fg: '#fff' },
  셀러: { bg: '#c8ccd1', fg: '#3a3a3a' },
  회원: { bg: '#ede7dc', fg: '#6b5d72' },
}

export function GradeChip({ grade }: { grade: string }) {
  const styles = GRADE_STYLES[grade] || { bg: '#eee', fg: '#333' }
  return (
    <span
      style={{
        padding: '3px 10px',
        background: styles.bg,
        color: styles.fg,
        fontSize: 11.5,
        fontFamily: 'var(--sans)',
        letterSpacing: '0.02em',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        borderRadius: 6,
      }}
    >
      {grade}
    </span>
  )
}
