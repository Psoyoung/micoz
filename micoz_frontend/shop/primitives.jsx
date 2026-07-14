// MICOZ — 공유 프리미티브
// 모든 화면에서 쓰이는 작은 컴포넌트들

const { useState, useEffect, useRef, useMemo } = React;

// ─── 로고 ──────────────────────────────────────────────
function MicozLogo({ size = 22, color = '#1a1424' }) {
  return (
    <span style={{
      fontFamily: 'var(--serif-en)',
      fontSize: size,
      fontWeight: 400,
      letterSpacing: '0.32em',
      color,
      lineHeight: 1,
      display: 'inline-block',
      paddingLeft: '0.32em', // optical balance for the wide letter-spacing
    }}>
      MICOZ
    </span>
  );
}

// ─── 보틀 (그라디언트 색상 블록) ─────────────────────────
function Bottle({ grad, accent = '#9a7fb8', shape = 'tall', label, line, w = '100%', h = 360, showLabel = true }) {
  // shape: 'tall' (essence/serum), 'jar' (cream), 'wide' (toner)
  const dims = {
    tall:  { bw: 0.42, bh: 0.78, br: 18, capW: 0.30, capH: 0.10 },
    jar:   { bw: 0.62, bh: 0.50, br: 14, capW: 0.66, capH: 0.08 },
    wide:  { bw: 0.50, bh: 0.66, br: 24, capW: 0.34, capH: 0.09 },
    drop:  { bw: 0.40, bh: 0.62, br: 80, capW: 0.20, capH: 0.18 },
  }[shape] || { bw: 0.42, bh: 0.78, br: 18, capW: 0.30, capH: 0.10 };

  return (
    <div style={{
      position: 'relative',
      width: w, height: h,
      background: grad,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}>
      {/* soft glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.18), transparent 55%)`,
        pointerEvents: 'none',
      }}/>
      {/* bottle silhouette */}
      <div style={{
        position: 'relative',
        width: `${dims.bw * 100}%`,
        marginBottom: '14%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* cap */}
        <div style={{
          width: `${(dims.capW / dims.bw) * 100}%`,
          aspectRatio: `${dims.capW} / ${dims.capH}`,
          background: 'rgba(20, 12, 30, 0.85)',
          borderRadius: '4px 4px 2px 2px',
          marginBottom: -1,
          boxShadow: 'inset 0 -2px 4px rgba(255,255,255,0.05), inset 0 1px 1px rgba(255,255,255,0.12)',
        }}/>
        {/* body */}
        <div style={{
          width: '100%',
          aspectRatio: `${dims.bw} / ${dims.bh}`,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 35%, rgba(0,0,0,0.18) 100%)',
          backdropFilter: 'blur(0.5px)',
          borderRadius: dims.br,
          border: '1px solid rgba(255,255,255,0.18)',
          position: 'relative',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.35), inset 2px 0 6px rgba(255,255,255,0.08), inset -2px 0 8px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* shine streak */}
          <div style={{
            position: 'absolute',
            top: '8%', left: '14%',
            width: '8%', height: '60%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0))',
            borderRadius: 4,
          }}/>
          {showLabel && (
            <div style={{
              fontFamily: 'var(--serif-en)',
              color: 'rgba(255,255,255,0.78)',
              fontSize: shape === 'jar' ? 11 : 13,
              letterSpacing: '0.25em',
              textAlign: 'center',
              lineHeight: 1.4,
            }}>
              <div style={{ fontSize: shape === 'jar' ? 8 : 9, opacity: 0.6, marginBottom: 6, letterSpacing: '0.4em' }}>MICOZ</div>
              <div>{(line || label || '').toUpperCase()}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 버튼 ──────────────────────────────────────────────
function PrimaryBtn({ children, onClick, full, dark = true, size = 'md', style = {} }) {
  const sizes = {
    sm: { p: '10px 18px', fs: 12 },
    md: { p: '14px 28px', fs: 13 },
    lg: { p: '18px 36px', fs: 14 },
  }[size];
  return (
    <button onClick={onClick} style={{
      width: full ? '100%' : 'auto',
      padding: sizes.p,
      background: dark ? 'var(--plum-700)' : 'transparent',
      color: dark ? 'var(--cream)' : 'var(--plum-700)',
      border: dark ? 'none' : '1px solid var(--plum-700)',
      fontSize: sizes.fs,
      fontFamily: 'var(--sans)',
      fontWeight: 500,
      letterSpacing: '0.18em',
      cursor: 'pointer',
      transition: 'all .25s',
      textTransform: 'uppercase',
      ...style,
    }}
    onMouseEnter={(e) => {
      if (dark) e.currentTarget.style.background = 'var(--plum-800)';
      else { e.currentTarget.style.background = 'var(--plum-700)'; e.currentTarget.style.color = 'var(--cream)'; }
    }}
    onMouseLeave={(e) => {
      if (dark) e.currentTarget.style.background = 'var(--plum-700)';
      else { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--plum-700)'; }
    }}
    >
      {children}
    </button>
  );
}

// ─── 가는 링크 (밑줄형) ─────────────────────────────────
function ThinLink({ children, onClick, color = 'var(--ink)', size = 12 }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent',
      border: 'none',
      borderBottom: `1px solid ${color}`,
      padding: '4px 0',
      fontSize: size,
      letterSpacing: '0.25em',
      color, cursor: 'pointer',
      fontFamily: 'var(--sans)',
      fontWeight: 400,
      textTransform: 'uppercase',
    }}>
      {children}
    </button>
  );
}

// ─── 이쁜 셀렉터 (가로 라인) ─────────────────────────────
function OptionPicker({ options, value, onChange, color = 'var(--plum-700)' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((o) => {
        const sel = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            background: sel ? 'rgba(42, 26, 62, 0.04)' : 'transparent',
            border: `1px solid ${sel ? color : 'var(--line)'}`,
            cursor: 'pointer',
            transition: 'all .2s',
            fontFamily: 'var(--sans)',
            color: 'var(--ink)',
            textAlign: 'left',
          }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 12,
              fontSize: 13, fontWeight: sel ? 500 : 400,
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                border: `1.5px solid ${sel ? color : 'var(--line-strong)'}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {sel && <span style={{ width: 6, height: 6, background: color, borderRadius: '50%' }}/>}
              </span>
              {o.label}
            </span>
            <span style={{ fontFamily: 'var(--serif-en)', fontSize: 14 }}>
              {window.MICOZ_DATA.won(o.price)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── 카운터 ─────────────────────────────────────────────
function Counter({ value, onChange, min = 1, max = 99 }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      border: '1px solid var(--line-strong)',
    }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={countBtn}>−</button>
      <span style={{
        minWidth: 40, textAlign: 'center', fontFamily: 'var(--serif-en)', fontSize: 14,
        padding: '0 4px',
      }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={countBtn}>+</button>
    </div>
  );
}
const countBtn = {
  width: 36, height: 36, border: 'none', background: 'transparent',
  cursor: 'pointer', fontSize: 16, color: 'var(--ink)',
  fontFamily: 'var(--sans)',
};

// ─── 페이드인 래퍼 ──────────────────────────────────────
function FadeIn({ children, delay = 0, y = 12 }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: on ? 1 : 0,
      transform: on ? 'translateY(0)' : `translateY(${y}px)`,
      transition: 'opacity .8s ease, transform .8s ease',
    }}>{children}</div>
  );
}

// ─── 페이지 트랜지션 (key 변할 때 페이드) ─────────────────
function PageFade({ pageKey, children }) {
  const [shown, setShown] = useState(pageKey);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (pageKey !== shown) {
      setVisible(false);
      const t = setTimeout(() => {
        setShown(pageKey);
        setVisible(true);
        window.scrollTo?.({ top: 0 });
      }, 180);
      return () => clearTimeout(t);
    }
  }, [pageKey, shown]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transition: 'opacity .25s ease',
    }}>
      {children}
    </div>
  );
}

// ─── 작은 SVG 아이콘들 ──────────────────────────────────
const Icon = {
  search: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
    </svg>
  ),
  bag: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/>
    </svg>
  ),
  user: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>
    </svg>
  ),
  heart: (s = 16, c = 'currentColor', filled = false) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? c : 'none'} stroke={c} strokeWidth="1.4">
      <path d="M12 21s-7-4.5-9.5-9A5 5 0 0112 6a5 5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z"/>
    </svg>
  ),
  arrow: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  plus: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  close: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  ),
  menu: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <path d="M4 7h16M4 12h16M4 17h16"/>
    </svg>
  ),
  check: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6">
      <path d="M5 12l5 5L20 7"/>
    </svg>
  ),
  back: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
      <path d="M15 6l-6 6 6 6"/>
    </svg>
  ),
};

// ─── 제품 카드 ──────────────────────────────────────────
function ProductCard({ p, onClick, onAdd, dark = false, compact = false }) {
  const [hover, setHover] = useState(false);
  const ph = compact ? 280 : 380;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        background: 'transparent',
        position: 'relative',
      }}>
      <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 18 }}>
        <div style={{
          transition: 'transform .8s cubic-bezier(.2,.7,.3,1)',
          transform: hover ? 'scale(1.04)' : 'scale(1)',
        }}>
          {p.img ? (
            <div style={{
              width: '100%', height: ph,
              background: p.grad || '#f5f1ea',
              backgroundImage: `url(${p.img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
          ) : (
            <Bottle grad={p.grad} accent={p.accent} h={ph} line={p.nameEn} shape={p.category === '크림' ? 'jar' : p.category === '토너' ? 'wide' : 'tall'} />
          )}
        </div>
        {p.badge && (
          <div style={{
            position: 'absolute', top: 14, left: 14,
            padding: '5px 10px',
            background: 'rgba(245, 241, 234, 0.92)',
            color: 'var(--plum-700)',
            fontSize: 10, letterSpacing: '0.2em',
            fontWeight: 500,
          }}>{p.badge}</div>
        )}
        {onAdd && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(p); }}
            style={{
              position: 'absolute', right: 14, bottom: 14,
              width: 40, height: 40,
              background: 'rgba(245, 241, 234, 0.95)',
              border: 'none', cursor: 'pointer',
              opacity: hover ? 1 : 0,
              transform: hover ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all .3s',
              color: 'var(--plum-700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="장바구니에 담기"
          >{Icon.plus(14)}</button>
        )}
      </div>
      <div style={{ color: dark ? 'var(--cream)' : 'var(--ink)' }}>
        <div style={{
          fontFamily: 'var(--serif-en)',
          fontSize: 11, letterSpacing: '0.3em',
          color: dark ? 'rgba(245,241,234,0.55)' : 'var(--muted)',
          marginBottom: 8,
          textTransform: 'uppercase',
        }}>{p.line}</div>
        <div style={{
          fontFamily: 'var(--serif)',
          fontSize: compact ? 17 : 19,
          fontWeight: 400,
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}>{p.name}</div>
        <div style={{
          fontFamily: 'var(--serif-en)',
          fontSize: 14,
          color: dark ? 'rgba(245,241,234,0.85)' : 'var(--ink)',
        }}>{window.MICOZ_DATA.won(p.price)}</div>
      </div>
    </div>
  );
}

// ─── 토스트 (장바구니 추가 알림) ────────────────────────
function Toast({ show, message, onClose }) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 2400);
      return () => clearTimeout(t);
    }
  }, [show, onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%',
      transform: `translateX(-50%) translateY(${show ? 0 : 16}px)`,
      opacity: show ? 1 : 0,
      transition: 'all .3s ease',
      background: 'var(--plum-700)',
      color: 'var(--cream)',
      padding: '14px 28px',
      fontSize: 13, letterSpacing: '0.05em',
      zIndex: 9999,
      pointerEvents: show ? 'auto' : 'none',
      boxShadow: '0 12px 40px rgba(42, 26, 62, 0.3)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ color: 'var(--plum-200)' }}>{Icon.check(14)}</span>
      {message}
    </div>
  );
}

Object.assign(window, {
  MicozLogo, Bottle, PrimaryBtn, ThinLink, OptionPicker, Counter,
  FadeIn, PageFade, Icon, ProductCard, Toast,
});
