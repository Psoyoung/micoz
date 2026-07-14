// MICOZ Admin — primitives & chrome

const { useState, useEffect, useRef, useMemo } = React;

// ─── 아이콘 (1.4 stroke, 18px default) ────────────────────
const AIcon = {
  dash:    (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM3 21h8v-6H3v6zM13 3v6h8V3h-8z"/></svg>,
  user:    (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>,
  folder:  (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 6h6l2 3h10v10H3V6z"/></svg>,
  box:     (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10"/></svg>,
  cart:    (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 4h2l2.4 11.4a2 2 0 002 1.6h7.6a2 2 0 002-1.6L21 8H6"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>,
  chart:   (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>,
  cog:     (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>,
  chat:    (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M21 12a8 8 0 01-11.6 7.1L4 21l1.9-5.4A8 8 0 1121 12z"/></svg>,
  search:  (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>,
  bell:    (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 004 0"/></svg>,
  arrowUp: (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 14l5-5 5 5"/></svg>,
  arrowDn: (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 10l5 5 5-5"/></svg>,
  more:    (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>,
  download:(s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 4v12M7 11l5 5 5-5M4 20h16"/></svg>,
  plus:    (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 12h14"/></svg>,
  edit:    (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 20h4l10-10-4-4L4 16v4z"/></svg>,
  trash:   (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>,
  filter:  (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></svg>,
  caret:   (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 9l6 6 6-6"/></svg>,
  chevR:   (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 6l6 6-6 6"/></svg>,
};

// ─── 사이드바 ─────────────────────────────────────────
const NAV = [
  { key: 'dashboard',  label: '대시보드',     icon: 'dash',    code: 'OVERVIEW' },
  { key: 'members',    label: '회원관리',     icon: 'user',    code: 'MEMBERS' },
  { key: 'categories', label: '카테고리관리', icon: 'folder',  code: 'CATEGORY' },
  { key: 'products',   label: '상품관리',     icon: 'box',     code: 'PRODUCT' },
  { key: 'orders',     label: '주문관리',     icon: 'cart',    code: 'ORDER' },
  { key: 'inquiries',  label: '1:1 문의',     icon: 'chat',    code: 'INQUIRY' },
  { key: 'banner',   label: '메인 배너 설정',    icon: 'chart', code: 'BANNER' },
  { key: 'shipping', label: '배송 설정',        icon: 'box',   code: 'SHIP' },
  { key: 'team',     label: '관리자 계정 관리', icon: 'cog',   code: 'TEAM' },
];

function Sidebar({ current, onNav }) {
  return (
    <aside style={{
      width: 248,
      background: '#2d2347',
      color: '#ddd5e8',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #3a3056',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflow: 'auto',
    }}>
      {/* logo */}
      <div style={{
        padding: '22px 22px 18px',
        borderBottom: '1px solid #3a3056',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--serif-en)',
            fontSize: 18,
            letterSpacing: '0.32em',
            color: '#f5f1ea',
            paddingLeft: '0.32em',
          }}>MICOZ</div>
          <div style={{
            fontSize: 10,
            letterSpacing: '0.28em',
            color: '#8a7ba0',
            marginTop: 6,
            fontFamily: 'var(--mono)',
          }}>ADMIN · v2.6.1</div>
        </div>
        <span style={{
          fontSize: 9, letterSpacing: '0.2em',
          color: '#8a7ba0', fontFamily: 'var(--mono)',
          padding: '2px 6px', border: '1px solid #2a2240',
        }}>PROD</span>
      </div>

      {/* nav */}
      <nav style={{ padding: '14px 12px', flex: 1, background: '#3a2e58' }}>
        <div style={navHeader}>운영</div>
        {NAV.map((n) => {
          const active = current === n.key;
          return (
            <button
              key={n.key}
              onClick={() => onNav(n.key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 12px',
                background: active ? '#4c3c70' : 'transparent',
                color: active ? '#f5f1ea' : '#c0b3d4',
                border: 'none',
                borderLeft: `2px solid ${active ? '#c4b0d8' : 'transparent'}`,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--sans)',
                fontSize: 13.5,
                transition: 'background .15s',
                position: 'relative',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#443663'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ opacity: active ? 1 : 0.7, display: 'flex' }}>{AIcon[n.icon](17)}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge && (
                <span style={{
                  fontSize: 10,
                  fontFamily: 'var(--mono)',
                  background: active ? '#c4b0d8' : '#3a2552',
                  color: active ? '#0f0a1c' : '#e8d8f0',
                  padding: '2px 6px',
                  minWidth: 20,
                  textAlign: 'center',
                  letterSpacing: '0.04em',
                }}>{n.badge}</span>
              )}
            </button>
          );
        })}

      </nav>

      {/* footer / user */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid #1a1429',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(155deg, #3a2552, #9a7fb8)',
          color: '#f5f1ea',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--serif-en)', fontSize: 13, letterSpacing: '0.04em',
          flexShrink: 0,
        }}>JE</div>
        <div style={{ lineHeight: 1.25, minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: '#f5f1ea',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{window.ADMIN_DATA.ADMIN_USER.name}</div>
          <div style={{
            fontSize: 10, color: '#7c6f93',
            fontFamily: 'var(--mono)', letterSpacing: '0.08em',
            marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{window.ADMIN_DATA.ADMIN_USER.role}</div>
        </div>
      </div>
    </aside>
  );
}
const navHeader = {
  fontSize: 10,
  letterSpacing: '0.32em',
  color: '#5a4d72',
  padding: '8px 14px 10px',
  fontFamily: 'var(--mono)',
  textTransform: 'uppercase',
};

// ─── 상단 바 ──────────────────────────────────────────
function Topbar({ title, crumbs = [], rightExtra }) {
  return (
    <header style={{
      height: 64,
      padding: '0 32px',
      borderBottom: '1px solid var(--ad-line)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--ad-paper)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div>
        <div style={{
          fontSize: 11,
          color: 'var(--ad-muted)',
          fontFamily: 'var(--mono)',
          letterSpacing: '0.18em',
          marginBottom: 3,
        }}>
          {crumbs.map((c, i) => (
            <span key={i}>
              {c}
              {i < crumbs.length - 1 && <span style={{ margin: '0 8px', opacity: 0.5 }}>/</span>}
            </span>
          ))}
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: 'var(--serif)',
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: 'var(--ad-ink)',
        }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {rightExtra}
        <button
          type="button"
          title="로그아웃"
          style={{
            ...iconBtn,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ad-ink)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ad-paper-2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4"/>
            <path d="M10 17l-5-5 5-5"/>
            <path d="M5 12h12"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
const iconBtn = {
  position: 'relative',
  width: 36, height: 36,
  background: '#fff',
  border: '1px solid var(--ad-line)',
  cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--ad-ink)',
};

// ─── 카드 컨테이너 ────────────────────────────────────
function Card({ title, subtitle, action, children, padding = 22, style = {} }) {
  return (
    <section style={{
      background: '#fff',
      border: '1px solid var(--ad-line)',
      ...style,
    }}>
      {(title || action) && (
        <header style={{
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--ad-line)',
        }}>
          <div style={{ minWidth: 0 }}>
            {title && <div style={{
              fontFamily: 'var(--serif)',
              fontSize: 15, fontWeight: 500,
              color: 'var(--ad-ink)',
            }}>{title}</div>}
            {subtitle && <div style={{
              fontSize: 11, color: 'var(--ad-muted)',
              fontFamily: 'var(--mono)', letterSpacing: '0.08em',
              marginTop: 3, whiteSpace: 'nowrap',
            }}>{subtitle}</div>}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </header>
      )}
      <div style={{ padding }}>{children}</div>
    </section>
  );
}

// ─── 통계 셀 ──────────────────────────────────────────
function Stat({ label, value, sub, delta, deltaPositive = true, accent, spark }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--ad-line)',
      padding: '22px 24px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: 138,
    }}>
      {accent && <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 32, height: 3, background: accent,
      }}/>}
      <div>
        <div style={{
          fontSize: 11,
          color: 'var(--ad-muted)',
          fontFamily: 'var(--mono)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>{label}</div>
        <div style={{
          fontFamily: 'var(--serif-en)',
          fontSize: 32,
          fontWeight: 400,
          color: 'var(--ad-ink)',
          marginTop: 10,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}>{value}</div>
        {sub && <div style={{
          fontSize: 11, color: 'var(--ad-muted)',
          marginTop: 6, fontFamily: 'var(--mono)', letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}>{sub}</div>}
      </div>
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: 12,
      }}>
        {delta && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontFamily: 'var(--mono)',
            color: deltaPositive ? '#3a8a5a' : '#c14d4d',
            letterSpacing: '0.04em',
          }}>
            {deltaPositive ? AIcon.arrowUp(11) : AIcon.arrowDn(11)} {delta}
          </span>
        )}
        {spark && <div style={{ flex: '0 0 96px' }}>{spark}</div>}
      </div>
    </div>
  );
}

// ─── 스파크라인 ───────────────────────────────────────
function Sparkline({ data, w = 96, h = 28, color = '#3a2552', fill = 'rgba(58, 37, 82, 0.10)' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 4) - 2]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <path d={area} fill={fill} stroke="none"/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.4"/>
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color}/>
    </svg>
  );
}

// ─── 바 차트 (수평) ────────────────────────────────────
function BarRow({ label, value, max, format, color = '#3a2552', sub }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 6, fontSize: 12.5, gap: 12,
      }}>
        <span style={{ color: 'var(--ad-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>{label}</span>
        <span style={{
          fontFamily: 'var(--mono)', color: 'var(--ad-ink)',
          fontSize: 12,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>{format ? format(value) : value}</span>
      </div>
      <div style={{
        position: 'relative',
        height: 4,
        background: 'var(--ad-line-soft)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: pct + '%',
          background: color,
        }}/>
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--ad-muted)', marginTop: 4, fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>{sub}</div>}
    </div>
  );
}

// ─── 도넛 ─────────────────────────────────────────────
function Donut({ data, size = 180, thickness = 22, centerLabel, centerValue }) {
  const total = data.reduce((a, b) => a + b.amount, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
        {data.map((d, i) => {
          const frac = d.amount / total;
          const len = c * frac;
          const dasharray = `${len} ${c - len}`;
          const el = (
            <circle key={i} r={r} cx={0} cy={0}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={dasharray}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </g>
      {centerLabel && (
        <g>
          <text x={size/2} y={size/2 - 6} textAnchor="middle"
            style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', fill: 'var(--ad-muted)' }}>
            {centerLabel}
          </text>
          <text x={size/2} y={size/2 + 18} textAnchor="middle"
            style={{ fontFamily: 'var(--serif-en)', fontSize: 20, fill: 'var(--ad-ink)' }}>
            {centerValue}
          </text>
        </g>
      )}
    </svg>
  );
}

// ─── 상태 칩 ──────────────────────────────────────────
const STATUS_STYLES = {
  '판매중':    { bg: '#eaf4ee', fg: '#2d6a44', dot: '#3a8a5a' },
  '판매중지':  { bg: '#f1eef5', fg: '#6b5d72', dot: '#9a8fa6' },
  '재고부족':  { bg: '#fbf1e8', fg: '#8a5a1c', dot: '#c08a3a' },
  '품절':      { bg: '#fbece9', fg: '#8a3a2c', dot: '#c14d4d' },
  '결제완료':  { bg: '#eaf4ee', fg: '#2d6a44', dot: '#3a8a5a' },
  '입금대기':  { bg: '#fbf1e8', fg: '#8a5a1c', dot: '#c08a3a' },
  '취소':      { bg: '#f4eaea', fg: '#7a3a3a', dot: '#a85050' },
  '환불':      { bg: '#fbece9', fg: '#8a3a2c', dot: '#c14d4d' },
  '활성':      { bg: '#eaf4ee', fg: '#2d6a44', dot: '#3a8a5a' },
  '휴면':      { bg: '#f1eef5', fg: '#6b5d72', dot: '#9a8fa6' },
  '탈퇴신청':  { bg: '#fbece9', fg: '#8a3a2c', dot: '#c14d4d' },
  '준비중':    { bg: '#f1edf7', fg: '#4d3470', dot: '#6b4d8f' },
  '배송중':    { bg: '#e8eef7', fg: '#2a4d8a', dot: '#3a6dbf' },
  '배송완료':  { bg: '#eaf4ee', fg: '#2d6a44', dot: '#3a8a5a' },
  '대기':      { bg: '#f1eef5', fg: '#6b5d72', dot: '#9a8fa6' },
  '진행중':    { bg: '#fdf3e3', fg: '#7a5a1a', dot: '#c08a3a' },
  '답변완료':  { bg: '#eaf4ee', fg: '#2d6a44', dot: '#3a8a5a' },
  '반품완료':  { bg: '#f4eaea', fg: '#7a3a3a', dot: '#a85050' },
};
function StatusChip({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#eee', fg: '#333', dot: '#666' };
  return (
    <span style={{
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
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }}/>
      {status}
    </span>
  );
}

// ─── 직급 칩 ──────────────────────────────────────────
function GradeChip({ grade }) {
  const styles = {
    '전무':   { bg: '#3a2552', fg: '#f5edf7' },
    '상무':   { bg: '#6b4d8f', fg: '#f5edf7' },
    '마스터': { bg: '#b89968', fg: '#fff' },
    '셀러':   { bg: '#c8ccd1', fg: '#3a3a3a' },
    '회원':   { bg: '#ede7dc', fg: '#6b5d72' },
  }[grade] || { bg: '#eee', fg: '#333' };
  return (
    <span style={{
      padding: '3px 10px',
      background: styles.bg,
      color: styles.fg,
      fontSize: 11.5,
      fontFamily: 'var(--sans)',
      letterSpacing: '0.02em',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      borderRadius: 6,
    }}>{grade}</span>
  );
}

// ─── 테이블 ──────────────────────────────────────────
function DataTable({ columns, rows, onRowClick, onRowEdit, rowKey = 'id' }) {
  const [selected, setSelected] = useState(new Set());
  const allSel = selected.size === rows.length && rows.length > 0;
  const toggleAll = () => {
    if (allSel) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r[rowKey])));
  };
  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  return (
    <div style={{ overflow: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 12.5,
        fontFamily: 'var(--sans)',
      }}>
        <thead>
          <tr style={{ background: 'var(--ad-paper-2)', borderBottom: '1px solid var(--ad-line)' }}>
            <th style={{ ...thStyle, width: 40, paddingLeft: 22 }}>
              <input type="checkbox" checked={allSel} onChange={toggleAll}/>
            </th>
            {columns.map((c, i) => (
              <th key={i} style={{
                ...thStyle,
                textAlign: c.align || 'left',
                width: c.w,
              }}>{c.label}</th>
            ))}
            <th style={{ ...thStyle, width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const sel = selected.has(r[rowKey]);
            return (
              <tr key={r[rowKey] || ri}
                onClick={() => onRowClick?.(r)}
                style={{
                  borderBottom: '1px solid var(--ad-line-soft)',
                  cursor: onRowClick ? 'pointer' : 'default',
                  background: sel ? '#f8f4fb' : 'transparent',
                }}
                onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = '#fafaf7'; }}
                onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ ...tdStyle, paddingLeft: 22 }} onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={sel} onChange={() => toggle(r[rowKey])}/>
                </td>
                {columns.map((c, i) => (
                  <td key={i} style={{
                    ...tdStyle,
                    textAlign: c.align || 'left',
                    fontFamily: c.mono ? 'var(--mono)' : 'var(--sans)',
                    fontSize: c.mono ? 12 : 12.5,
                    color: c.muted ? 'var(--ad-muted)' : 'var(--ad-ink)',
                    whiteSpace: c.nowrap ? 'nowrap' : 'normal',
                  }}>
                    {c.render ? c.render(r[c.key], r) : r[c.key]}
                  </td>
                ))}
                <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                  {onRowEdit ? (
                    <button
                      type="button"
                      onClick={() => onRowEdit(r)}
                      style={rowEditBtn}
                    >수정</button>
                  ) : (
                    <button style={rowAction}>{AIcon.more(14)}</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
const thStyle = {
  padding: '12px 14px',
  textAlign: 'left',
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ad-muted)',
  fontFamily: 'var(--mono)',
  whiteSpace: 'nowrap',
};
const tdStyle = {
  padding: '14px 14px',
  color: 'var(--ad-ink)',
  verticalAlign: 'middle',
};
const rowAction = {
  width: 28, height: 28,
  background: 'transparent',
  border: 'none', cursor: 'pointer',
  color: 'var(--ad-muted)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};
const rowEditBtn = {
  padding: '5px 12px',
  background: '#fff',
  border: '1px solid var(--ad-line-strong)',
  cursor: 'pointer',
  fontFamily: 'var(--sans)',
  fontSize: 11.5,
  color: 'var(--ad-ink)',
  letterSpacing: '0.02em',
};

// ─── 버튼 (관리자용) ──────────────────────────────────
function AdminBtn({ children, onClick, variant = 'default', icon, size = 'md', style = {} }) {
  const palette = {
    primary:   { bg: '#3a2552', fg: '#f5f1ea', bd: '#3a2552' },
    default:   { bg: '#fff',    fg: '#1a1424', bd: 'var(--ad-line-strong)' },
    danger:    { bg: '#fff',    fg: '#8a3a2c', bd: '#e6c8c1' },
    ghost:     { bg: 'transparent', fg: '#1a1424', bd: 'transparent' },
  }[variant];
  const sizes = { sm: '6px 12px', md: '9px 16px', lg: '12px 22px' }[size];
  const fs = { sm: 11.5, md: 12.5, lg: 13 }[size];
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: sizes,
      background: palette.bg,
      color: palette.fg,
      border: `1px solid ${palette.bd}`,
      fontFamily: 'var(--sans)',
      fontWeight: 500,
      fontSize: fs,
      cursor: 'pointer',
      letterSpacing: '0.02em',
      transition: 'all .15s',
      ...style,
    }}
    onMouseEnter={(e) => { if (variant === 'default') e.currentTarget.style.background = 'var(--ad-paper-2)'; if (variant === 'primary') e.currentTarget.style.background = '#2a1a3e'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = palette.bg; }}
    >
      {icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </button>
  );
}

// ─── 페이지네이션 ─────────────────────────────────────
function Pagination({ page, total, pageSize, onChange }) {
  const pages = Math.ceil(total / pageSize);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 22px',
      borderTop: '1px solid var(--ad-line)',
      fontSize: 12,
      color: 'var(--ad-muted)',
      fontFamily: 'var(--mono)',
      letterSpacing: '0.04em',
    }}>
      <div>총 {total.toLocaleString()}건 · {page}/{pages} 페이지</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button style={pageBtn} onClick={() => onChange(Math.max(1, page - 1))}>이전</button>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            ...pageBtn,
            background: n === page ? '#3a2552' : '#fff',
            color:      n === page ? '#f5f1ea' : 'var(--ad-ink)',
            borderColor: n === page ? '#3a2552' : 'var(--ad-line)',
          }}>{n}</button>
        ))}
        <button style={pageBtn} onClick={() => onChange(Math.min(pages, page + 1))}>다음</button>
      </div>
    </div>
  );
}
const pageBtn = {
  minWidth: 30,
  padding: '6px 10px',
  fontFamily: 'var(--mono)',
  fontSize: 12,
  background: '#fff',
  border: '1px solid var(--ad-line)',
  color: 'var(--ad-ink)',
  cursor: 'pointer',
};

// ─── 필터 바 ──────────────────────────────────────────
function FilterBar({ children, action }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 22px',
      borderBottom: '1px solid var(--ad-line)',
      background: 'var(--ad-paper-2)',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{children}</div>
      <div style={{ display: 'flex', gap: 8 }}>{action}</div>
    </div>
  );
}

function FilterChip({ label, value, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px',
      fontFamily: 'var(--sans)',
      fontSize: 12,
      background: active ? '#3a2552' : '#fff',
      color: active ? '#f5f1ea' : 'var(--ad-ink)',
      border: `1px solid ${active ? '#3a2552' : 'var(--ad-line-strong)'}`,
      cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      <span>{label}</span>
      {value !== undefined && <span style={{
        fontFamily: 'var(--mono)', fontSize: 10,
        opacity: 0.7, letterSpacing: '0.04em',
      }}>{value}</span>}
    </button>
  );
}

// ─── 관리자 드롭다운 ──────────────────────────────────
function AdminDropdown({ label, value, onChange, options, width = 180 }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const isFluid = typeof width === 'string';

  React.useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const current = options.find(o => o.k === value) || options[0];
  const isAll = current.k === 'all';

  return (
    <div ref={ref} style={{ position: 'relative', display: isFluid ? 'block' : 'inline-block', width: isFluid ? width : undefined }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width,
          padding: '6px 10px 6px 12px',
          background: '#fff',
          border: `1px solid ${open ? '#3a2552' : 'var(--ad-line-strong)'}`,
          cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--sans)',
          fontSize: 12.5,
          color: 'var(--ad-ink)',
          textAlign: 'left',
          minHeight: 30,
        }}
      >
        <span style={{
          flex: 1,
          color: isAll ? 'var(--ad-muted)' : 'var(--ad-ink)',
          fontWeight: isAll ? 400 : 500,
        }}>{current.l}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--ad-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .12s' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          width: isFluid ? '100%' : width + 20,
          background: '#fff',
          border: '1px solid var(--ad-line-strong)',
          boxShadow: '0 8px 24px rgba(26, 20, 36, 0.10)',
          zIndex: 50,
          padding: '4px 0',
          maxHeight: 320,
          overflowY: 'auto',
        }}>
          {options.map(o => {
            const selected = o.k === value;
            return (
              <button
                key={o.k}
                type="button"
                onClick={() => { onChange(o.k); setOpen(false); }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: selected ? 'var(--ad-paper-2)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--sans)',
                  fontSize: 12.5,
                  color: 'var(--ad-ink)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'var(--ad-line-soft)'; }}
                onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{
                  width: 12, display: 'inline-flex', justifyContent: 'center',
                  color: '#3a2552',
                }}>
                  {selected ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12l5 5L20 7"/>
                    </svg>
                  ) : null}
                </span>
                <span style={{ flex: 1, fontWeight: selected ? 500 : 400 }}>{o.l}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  AIcon, Sidebar, Topbar, Card, Stat, Sparkline, BarRow, Donut,
  StatusChip, GradeChip, DataTable, AdminBtn, Pagination, FilterBar, FilterChip,
  AdminDropdown,
});
