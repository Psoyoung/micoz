// MICOZ 로고 — 출처: 원본 shop/primitives.jsx MicozLogo

type Props = {
  size?: number
  color?: string
}

export default function MicozLogo({ size = 22, color = 'var(--ink)' }: Props) {
  return (
    <span
      style={{
        fontFamily: 'var(--serif-en)',
        fontSize: size,
        fontWeight: 400,
        letterSpacing: '0.32em',
        color,
        lineHeight: 1,
        display: 'inline-block',
        paddingLeft: '0.32em', // optical balance for the wide letter-spacing
      }}
    >
      MICOZ
    </span>
  )
}
