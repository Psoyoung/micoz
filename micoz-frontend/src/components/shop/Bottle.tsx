// 그라디언트 보틀 비주얼 (이미지 없는 제품의 분위기 블록) — 출처: 원본 shop/primitives.jsx Bottle
// SVG/CSS 직접 구현, 외부 라이브러리 미사용. 색은 grad/accent props 로 주입(presentational).

export type BottleShape = 'tall' | 'jar' | 'wide' | 'drop'

type Props = {
  grad: string
  accent?: string
  shape?: BottleShape
  label?: string
  line?: string
  w?: number | string
  h?: number
  showLabel?: boolean
}

const DIMS: Record<BottleShape, { bw: number; bh: number; br: number; capW: number; capH: number }> = {
  tall: { bw: 0.42, bh: 0.78, br: 18, capW: 0.3, capH: 0.1 },
  jar: { bw: 0.62, bh: 0.5, br: 14, capW: 0.66, capH: 0.08 },
  wide: { bw: 0.5, bh: 0.66, br: 24, capW: 0.34, capH: 0.09 },
  drop: { bw: 0.4, bh: 0.62, br: 80, capW: 0.2, capH: 0.18 },
}

export default function Bottle({
  grad,
  shape = 'tall',
  label,
  line,
  w = '100%',
  h = 360,
  showLabel = true,
}: Props) {
  const dims = DIMS[shape]

  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        background: grad,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      {/* soft glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.18), transparent 55%)',
          pointerEvents: 'none',
        }}
      />
      {/* bottle silhouette */}
      <div
        style={{
          position: 'relative',
          width: `${dims.bw * 100}%`,
          marginBottom: '14%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* cap */}
        <div
          style={{
            width: `${(dims.capW / dims.bw) * 100}%`,
            aspectRatio: `${dims.capW} / ${dims.capH}`,
            background: 'rgba(20, 12, 30, 0.85)',
            borderRadius: '4px 4px 2px 2px',
            marginBottom: -1,
            boxShadow: 'inset 0 -2px 4px rgba(255,255,255,0.05), inset 0 1px 1px rgba(255,255,255,0.12)',
          }}
        />
        {/* body */}
        <div
          style={{
            width: '100%',
            aspectRatio: `${dims.bw} / ${dims.bh}`,
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 35%, rgba(0,0,0,0.18) 100%)',
            backdropFilter: 'blur(0.5px)',
            borderRadius: dims.br,
            border: '1px solid rgba(255,255,255,0.18)',
            position: 'relative',
            boxShadow:
              '0 20px 40px -10px rgba(0,0,0,0.35), inset 2px 0 6px rgba(255,255,255,0.08), inset -2px 0 8px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* shine streak */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '14%',
              width: '8%',
              height: '60%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0))',
              borderRadius: 4,
            }}
          />
          {showLabel && (
            <div
              style={{
                fontFamily: 'var(--serif-en)',
                color: 'rgba(255,255,255,0.78)',
                fontSize: shape === 'jar' ? 11 : 13,
                letterSpacing: '0.25em',
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              <div style={{ fontSize: shape === 'jar' ? 8 : 9, opacity: 0.6, marginBottom: 6, letterSpacing: '0.4em' }}>
                MICOZ
              </div>
              <div>{(line || label || '').toUpperCase()}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
