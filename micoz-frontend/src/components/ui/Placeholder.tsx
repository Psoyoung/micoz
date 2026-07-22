// 라우팅 뼈대 확인용 임시 플레이스홀더.
// 실제 페이지 내용 이식 단계에서 각 route 폴더의 페이지 컴포넌트로 교체된다.

type Props = {
  title: string
  path: string
  variant?: 'shop' | 'admin'
}

export default function Placeholder({ title, path, variant = 'shop' }: Props) {
  const isAdmin = variant === 'admin'
  return (
    <div
      style={{
        padding: '64px 56px',
        minHeight: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: isAdmin ? 'var(--ad-paper-2)' : 'var(--paper)',
        border: `1px solid ${isAdmin ? 'var(--ad-line)' : 'var(--line)'}`,
      }}
    >
      <div
        style={{
          fontFamily: isAdmin ? 'var(--mono)' : 'var(--serif-en)',
          fontSize: 12,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: isAdmin ? 'var(--ad-muted)' : 'var(--muted)',
        }}
      >
        {isAdmin ? 'ADMIN' : 'STOREFRONT'} · PLACEHOLDER
      </div>
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--serif)',
          fontWeight: 500,
          fontSize: 34,
          color: 'var(--plum-700)',
        }}
      >
        {title}
      </h1>
      <code
        style={{
          fontFamily: 'var(--mono, monospace)',
          fontSize: 13,
          color: 'var(--muted)',
        }}
      >
        {path}
      </code>
    </div>
  )
}
