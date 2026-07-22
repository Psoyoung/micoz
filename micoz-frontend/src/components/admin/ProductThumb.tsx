// 관리자 상품 썸네일 — 출처: 원본 admin/admin-views-2.jsx ProductThumb
// 2곳(상품관리·주문상세) 이상에서 사용 → components/admin 으로 승격.
// line(라인명) 키로 그라디언트 선택. 외부 이미지 없이 병 모양 SVG/그라디언트 직접 구현.

const THUMB_GRADS: Record<string, string> = {
  비온: 'linear-gradient(155deg, #2a1a3e 0%, #4d3470 45%, #9a7fb8 100%)',
  제린: 'linear-gradient(165deg, #18102a 0%, #3a2552 50%, #6b4d8f 100%)',
  루안: 'linear-gradient(140deg, #221638 0%, #4d3470 60%, #c4b0d8 100%)',
  단아: 'linear-gradient(170deg, #4d3470 0%, #9a7fb8 50%, #e8d8f0 100%)',
  여원: 'linear-gradient(150deg, #2a1a3e 0%, #6b4d8f 100%)',
  소단: 'linear-gradient(160deg, #18102a 0%, #221638 40%, #4d3470 100%)',
  청아: 'linear-gradient(180deg, #6b4d8f 0%, #c4b0d8 60%, #f5edf7 100%)',
  아담: 'linear-gradient(155deg, #221638 0%, #3a2552 50%, #9a7fb8 100%)',
  아카이브: 'linear-gradient(155deg, #4a4047 0%, #8a7a85 100%)',
}

export default function ProductThumb({ line }: { line: string }) {
  return (
    <div style={{ width: 38, height: 46, background: THUMB_GRADS[line] || THUMB_GRADS['비온'], flexShrink: 0, position: 'relative', borderRadius: 1 }}>
      <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 16, height: 4, background: 'rgba(20,12,30,0.8)', borderRadius: 1 }} />
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 22, height: 30, border: '1px solid rgba(255,255,255,0.18)', background: 'linear-gradient(160deg, rgba(255,255,255,0.14), rgba(0,0,0,0.18))', borderRadius: 2 }} />
    </div>
  )
}
