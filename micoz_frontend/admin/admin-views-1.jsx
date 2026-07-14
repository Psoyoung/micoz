// MICOZ Admin — Dashboard / Members / Categories views
const { useState: useStateV1, useMemo: useMemoV1 } = React;

// ═══════════════════════════════════════════════════════
// 대시보드
// ═══════════════════════════════════════════════════════
function DashboardView() {
  const D = window.ADMIN_DATA;
  const todayAmount = D.SALES_30D[D.SALES_30D.length - 1].amount;
  const yest = D.SALES_30D[D.SALES_30D.length - 2].amount;
  const todayDelta = (((todayAmount - yest) / yest) * 100).toFixed(1);

  return (
    <div style={pageWrap}>
      {/* KPI row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
      }}>
        <Stat
          label="오늘 매출"
          value={D.won(todayAmount)}
          sub="2026-05-20 14:32 기준"
          accent="#3a2552"
        />
        <Stat
          label="오늘 주문"
          value="84건"
          sub="결제완료 78 · 대기 6"
          accent="#6b4d8f"
        />
        <Stat
          label="신규 회원"
          value="142명"
          sub="이번 주 누적"
          accent="#b89968"
        />
        <Stat
          label="평균 주문액"
          value="₩186,420"
          sub="최근 30일"
          accent="#9a7fb8"
        />
      </div>

      {/* 채널별 유입 + 베스트셀러 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        <Card title="채널별 유입 현황" subtitle="TRAFFIC SOURCES · 7D" padding={0}>
          <ChannelInflow/>
        </Card>

        <Card title="베스트셀러 (30일)" subtitle="TOP 5" padding={22}>
          {D.TOP_PRODUCTS_30D.map((p, i) => (
            <BarRow
              key={p.name}
              label={`${String(i+1).padStart(2,'0')}. ${p.name}`}
              value={p.units}
              max={D.TOP_PRODUCTS_30D[0].units}
              format={(v) => v + '개 · ' + D.won(p.amount)}
              color={['#3a2552','#6b4d8f','#9a7fb8','#b89968','#c4b0d8'][i]}
            />
          ))}
        </Card>
      </div>

      {/* 매출 추이 (full width) */}
      <Card
        title="매출 추이"
        subtitle="LAST 30 DAYS · KRW"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {['7일', '30일', '90일', '연간'].map((p, i) => (
              <FilterChip key={p} label={p} active={i === 1}/>
            ))}
            <AdminBtn icon={AIcon.download(13)} size="sm">CSV</AdminBtn>
          </div>
        }
        padding={0}
      >
        <SalesAreaChart data={D.SALES_30D} wide/>
      </Card>
    </div>
  );
}

// ─── 채널별 유입 현황 ────────────────────────────────
function ChannelInflow() {
  const D = window.ADMIN_DATA;
  const channels = [
    { name: '자사몰 (직접 유입)', code: 'DIRECT',   sessions: 18420, share: 32.4, conv: 4.8, color: '#3a2552' },
    { name: '네이버 검색',         code: 'NAVER',    sessions: 12180, share: 21.4, conv: 3.2, color: '#6b4d8f' },
    { name: '카카오톡 채널',       code: 'KAKAO',    sessions:  8940, share: 15.7, conv: 6.1, color: '#9a7fb8' },
    { name: '인스타그램',          code: 'INSTA',    sessions:  6820, share: 12.0, conv: 2.4, color: '#b89968' },
    { name: '구글 검색',           code: 'GOOGLE',   sessions:  4280, share:  7.5, conv: 2.8, color: '#c4b0d8' },
    { name: '제휴 매거진',         code: 'REFERRAL', sessions:  3640, share:  6.4, conv: 3.6, color: '#d8c0e8' },
    { name: '기타',                code: 'OTHER',    sessions:  2540, share:  4.6, conv: 1.9, color: '#ede7dc' },
  ];
  const total = channels.reduce((a, b) => a + b.sessions, 0);
  const maxConv = Math.max(...channels.map(c => c.conv));
  return (
    <div>
      <div style={{
        padding: '16px 22px',
        borderBottom: '1px solid var(--ad-line)',
        display: 'flex', alignItems: 'baseline', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em' }}>TOTAL SESSIONS</div>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 26, marginTop: 4, lineHeight: 1 }}>{total.toLocaleString()}</div>
        </div>
        <div style={{
          fontSize: 11, color: '#3a8a5a', fontFamily: 'var(--mono)',
          letterSpacing: '0.04em', whiteSpace: 'nowrap',
        }}>+12.4% vs 지난주</div>
        <div style={{ flex: 1 }}/>
        <div style={{
          fontSize: 10.5, color: 'var(--ad-muted)', fontFamily: 'var(--mono)',
          letterSpacing: '0.14em', textAlign: 'right',
        }}>AVG CONV<br/><span style={{ fontFamily: 'var(--serif-en)', fontSize: 17, color: 'var(--ad-ink)', letterSpacing: 0 }}>3.8%</span></div>
      </div>

      {/* stacked bar */}
      <div style={{ padding: '16px 22px 8px' }}>
        <div style={{
          display: 'flex', height: 8, overflow: 'hidden',
          borderRadius: 1,
        }}>
          {channels.map(c => (
            <div key={c.code} style={{
              flex: c.sessions,
              background: c.color,
            }} title={`${c.name} ${c.share}%`}/>
          ))}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--ad-line)' }}>
            <th style={{ ...thStyle3, paddingLeft: 22 }}>채널</th>
            <th style={{ ...thStyle3, textAlign: 'right' }}>세션</th>
            <th style={{ ...thStyle3, textAlign: 'right' }}>비중</th>
            <th style={{ ...thStyle3, textAlign: 'right', paddingRight: 22 }}>전환율</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((c) => (
            <tr key={c.code} style={{ borderBottom: '1px solid var(--ad-line-soft)' }}>
              <td style={{ ...tdStyle3, paddingLeft: 22 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, background: c.color, borderRadius: 1, flexShrink: 0 }}/>
                  <span style={{ whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9,
                    color: 'var(--ad-muted)', letterSpacing: '0.12em',
                  }}>{c.code}</span>
                </span>
              </td>
              <td style={{ ...tdStyle3, textAlign: 'right', fontFamily: 'var(--mono)' }}>{c.sessions.toLocaleString()}</td>
              <td style={{ ...tdStyle3, textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--ad-muted)' }}>{c.share}%</td>
              <td style={{ ...tdStyle3, textAlign: 'right', paddingRight: 22 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  width: 110, justifyContent: 'flex-end',
                }}>
                  <span style={{
                    position: 'relative',
                    width: 56, height: 4,
                    background: 'var(--ad-line-soft)',
                    flexShrink: 0,
                  }}>
                    <span style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: (c.conv / maxConv * 100) + '%',
                      background: c.color,
                    }}/>
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, minWidth: 36, textAlign: 'right' }}>{c.conv}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const thStyle3 = {
  padding: '10px 14px', textAlign: 'left', fontWeight: 500,
  fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase',
  color: 'var(--ad-muted)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap',
};
const tdStyle3 = { padding: '11px 14px', color: 'var(--ad-ink)', verticalAlign: 'middle' };
const rowAction2 = {
  width: 24, height: 24,
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'var(--ad-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

// ─── Sales area chart ────────────────────────────────
function SalesAreaChart({ data }) {
  const w = 720, h = 240, pad = { l: 50, r: 16, t: 18, b: 28 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const max = Math.max(...data.map(d => d.amount));
  const xs = (i) => pad.l + (i / (data.length - 1)) * iw;
  const ys = (v) => pad.t + ih - (v / max) * ih;
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)} ${ys(d.amount)}`).join(' ');
  const area = `${path} L ${xs(data.length - 1)} ${pad.t + ih} L ${xs(0)} ${pad.t + ih} Z`;
  const D = window.ADMIN_DATA;
  return (
    <div style={{ padding: '20px 22px 22px' }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }} preserveAspectRatio="none">
        {/* y grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const y = pad.t + ih - f * ih;
          return (
            <g key={i}>
              <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#ede7dc" strokeWidth="1"/>
              <text x={pad.l - 8} y={y + 3} textAnchor="end"
                style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: '#8a7ba0', letterSpacing: '0.04em' }}>
                {D.wonM(max * f)}
              </text>
            </g>
          );
        })}
        {/* area */}
        <defs>
          <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2552" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="#3a2552" stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#salesArea)"/>
        <path d={path} fill="none" stroke="#3a2552" strokeWidth="1.8"/>
        {/* x ticks */}
        {data.filter((_, i) => i % 5 === 0 || i === data.length - 1).map((d, idx) => {
          const i = data.indexOf(d);
          return (
            <text key={i} x={xs(i)} y={h - 8} textAnchor="middle"
              style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: '#8a7ba0', letterSpacing: '0.04em' }}>
              5/{String(d.day).padStart(2, '0')}
            </text>
          );
        })}
        {/* last point */}
        <circle cx={xs(data.length - 1)} cy={ys(data[data.length - 1].amount)} r="4" fill="#3a2552"/>
        <circle cx={xs(data.length - 1)} cy={ys(data[data.length - 1].amount)} r="9" fill="#3a2552" fillOpacity="0.15"/>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 회원관리
// ═══════════════════════════════════════════════════════
function MembersView() {
  const D = window.ADMIN_DATA;
  const [grade, setGrade] = useStateV1('all');
  const [status, setStatus] = useStateV1('all');
  const [query, setQuery] = useStateV1('');
  const [addOpen, setAddOpen] = useStateV1(false);

  const GRADE_OPTS = [
    { k: 'all',     l: '전체 직급', n: 2971 },
    { k: '전무',    l: '전무',     n: 18 },
    { k: '상무',    l: '상무',     n: 64 },
    { k: '마스터',  l: '마스터',   n: 142 },
    { k: '셀러',    l: '셀러',     n: 486 },
    { k: '회원',    l: '회원',     n: 2261 },
  ];
  const STATUS_OPTS = [
    { k: 'all',     l: '전체 상태',   n: 2971 },
    { k: '활성',     l: '활성',       n: 2750 },
    { k: '휴면',     l: '휴면',       n: 218 },
    { k: '탈퇴신청', l: '탈퇴신청',   n: 3 },
  ];

  const filtered = D.MEMBERS.filter(m => {
    if (grade !== 'all' && m.grade !== grade) return false;
    if (status !== 'all' && m.status !== status) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
  });

  return (
    <div style={pageWrap}>
      <Card padding={0}>
        <FilterBar
          action={
            <>
              <AdminBtn icon={AIcon.download(13)} size="sm">내보내기</AdminBtn>
              <AdminBtn icon={AIcon.plus(13)} size="sm" variant="primary" onClick={() => setAddOpen(true)}>회원 추가</AdminBtn>
            </>
          }
        >
          <AdminDropdown
            label="직급"
            value={grade}
            onChange={setGrade}
            options={GRADE_OPTS}
            width={170}
          />
          <AdminDropdown
            label="상태"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTS}
            width={170}
          />
          <span style={{ width: 1, height: 22, background: 'var(--ad-line)', margin: '0 4px' }}/>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
            background: '#fff',
            border: '1px solid var(--ad-line-strong)',
            width: 280,
          }}>
            <span style={{ color: 'var(--ad-muted)', display: 'flex' }}>{AIcon.search(14)}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="회원 ID · 이름 검색"
              style={{
                border: 'none', outline: 'none', flex: 1,
                background: 'transparent',
                fontFamily: 'var(--sans)',
                fontSize: 12.5,
                color: 'var(--ad-ink)',
                minWidth: 0,
              }}/>
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--ad-muted)', display: 'flex', padding: 0,
                }}
                title="검색어 지우기"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M6 6l12 12M18 6L6 18"/>
                </svg>
              </button>
            )}
          </div>
        </FilterBar>

        <DataTable
          rowKey="id"
          columns={[
            { key: 'id',     label: '회원ID',  mono: true, nowrap: true, render: (v) => <span style={{ color: '#3a2552', fontWeight: 500 }}>{v}</span> },
            { key: 'name',   label: '이름',    render: (v, r) => (
              <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{v}</span>
            )},
            { key: 'grade',  label: '직급',    render: (v) => <GradeChip grade={v}/> },
            { key: 'email',  label: '이메일',  muted: true, mono: true },
            { key: 'phone',  label: '전화',    mono: true, muted: true, nowrap: true },
            { key: 'joined', label: '가입일',  mono: true, muted: true, nowrap: true },
            { key: 'orders', label: '주문', align: 'right', mono: true, render: (v) => v + '건' },
            { key: 'spend',  label: '누적 구매액', align: 'right', mono: true, nowrap: true, render: (v) => D.won(v) },
            { key: 'lastBuy',label: '최근 주문', mono: true, muted: true, nowrap: true },
            { key: 'status', label: '상태',    render: (v) => <StatusChip status={v}/> },
          ]}
          rows={filtered}
        />
        <Pagination page={1} total={query ? filtered.length : 2971} pageSize={20} onChange={() => {}}/>
      </Card>
      <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)}/>
    </div>
  );
}

// ─── 회원 추가 모달 ───────────────────────────────────
function AddMemberModal({ open, onClose }) {
  const [grade, setGrade] = useStateV1('회원');
  const [marketing, setMarketing] = useStateV1(true);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;

  const fieldStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--ad-line-strong)',
    background: '#fff',
    fontFamily: 'var(--sans)',
    fontSize: 13,
    color: 'var(--ad-ink)',
    outline: 'none',
  };
  const labelStyle = {
    display: 'block',
    fontSize: 11, color: 'var(--ad-muted)',
    fontFamily: 'var(--mono)', letterSpacing: '0.14em',
    marginBottom: 6, textTransform: 'uppercase',
  };
  const GRADES = ['전무', '상무', '마스터', '셀러', '회원'];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 10, 28, 0.55)',
        backdropFilter: 'blur(2px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        animation: 'modalIn .18s ease',
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onClose(); }}
        style={{
          background: '#fff',
          width: 'min(560px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)',
          border: '1px solid var(--ad-line-strong)',
        }}
      >
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 26px',
          borderBottom: '1px solid var(--ad-line)',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 11, color: 'var(--ad-muted)',
              fontFamily: 'var(--mono)', letterSpacing: '0.18em',
              marginBottom: 4,
            }}>NEW MEMBER</div>
            <div style={{
              fontFamily: 'var(--serif)', fontSize: 20,
              fontWeight: 500, color: 'var(--ad-ink)',
            }}>회원 추가</div>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 32, height: 32,
            background: 'transparent',
            border: '1px solid var(--ad-line-strong)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ad-ink)',
            flexShrink: 0,
          }} title="닫기 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18"/>
            </svg>
          </button>
        </div>

        {/* body */}
        <div style={{ padding: 26, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 18px' }}>
          <div>
            <div style={labelStyle}>아이디 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input
              style={{...fieldStyle, fontFamily: 'var(--mono)' }}
              placeholder="micoz_id"
              autoComplete="off"
              required/>
          </div>

          <div>
            <div style={labelStyle}>비밀번호 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input
              type="password"
              style={{...fieldStyle, fontFamily: 'var(--mono)' }}
              placeholder="••••••••"
              autoComplete="new-password"
              required/>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={labelStyle}>이름 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input style={fieldStyle} placeholder="홍길동" required/>
          </div>

          <div>
            <div style={labelStyle}>이메일 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input type="email" style={{...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="name@example.com" required/>
          </div>

          <div>
            <div style={labelStyle}>전화번호</div>
            <input style={{...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="010-0000-0000"/>
          </div>

          <div>
            <div style={labelStyle}>생년월일</div>
            <input style={{...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="1990-01-01"/>
          </div>

          <div>
            <div style={labelStyle}>직급</div>
            <select
              style={fieldStyle}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={labelStyle}>주소</div>
            <input style={fieldStyle} placeholder="서울특별시 성동구 ..."/>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={labelStyle}>메모</div>
            <textarea
              style={{ ...fieldStyle, minHeight: 72, resize: 'vertical', fontFamily: 'var(--sans)' }}
              placeholder="고객 응대 시 참고할 내용"
            />
          </div>

          <label style={{
            gridColumn: '1 / -1',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 12.5, color: 'var(--ad-ink)',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
            />
            마케팅 정보 수신에 동의 (이메일 · SMS)
          </label>
        </div>

        {/* footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '16px 26px',
          borderTop: '1px solid var(--ad-line)',
          background: 'var(--ad-paper-2)',
        }}>
          <AdminBtn onClick={onClose}>취소</AdminBtn>
          <button type="submit" style={{
            padding: '8px 18px',
            background: '#3a2552', color: '#f5f1ea',
            border: '1px solid #3a2552',
            cursor: 'pointer',
            fontFamily: 'var(--sans)',
            fontSize: 12.5,
            letterSpacing: '0.02em',
          }}>회원 추가</button>
        </div>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 카테고리 관리
// ═══════════════════════════════════════════════════════
function CategoriesView() {
  const D = window.ADMIN_DATA;
  const [sel, setSel] = useStateV1('c-skin-essence');
  return (
    <div style={pageWrap}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr',
        gap: 16,
      }}>
        {/* Tree */}
        <Card
          title="카테고리 트리"
          subtitle="DRAG TO REORDER · 2 LEVELS"
          padding={0}
          action={<AdminBtn icon={AIcon.plus(13)} size="sm" variant="primary">대분류 추가</AdminBtn>}
        >
          <div style={{ padding: '8px 0' }}>
            {D.CATEGORIES_TREE.map((c, i) => (
              <React.Fragment key={c.id}>
                <CatRow cat={c} sel={sel === c.id} onSel={() => setSel(c.id)} idx={i + 1}/>
                {c.children?.map((cc, j) => (
                  <CatRow key={cc.id} cat={cc} sel={sel === cc.id} onSel={() => setSel(cc.id)} idx={`${i + 1}.${j + 1}`}/>
                ))}
              </React.Fragment>
            ))}
          </div>
        </Card>

        {/* Editor */}
        <Card title="카테고리 편집" subtitle="EDIT · 에센스 · 앰플" padding={22}>
          <FormField label="카테고리명">
            <Input value="에센스 · 앰플"/>
          </FormField>
          <FormField label="URL 슬러그">
            <Input value="essence-ampoule" mono/>
          </FormField>
          <FormField label="상위 카테고리">
            <Select value="스킨케어" options={['스킨케어', '클렌징', '스페셜케어', '세트 · 키트', '맨즈 라인']}/>
          </FormField>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
          }}>
            <FormField label="정렬 순서">
              <Input value="01" mono short/>
            </FormField>
            <FormField label="노출">
              <Toggle on label="쇼핑몰에 공개"/>
            </FormField>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            paddingTop: 16, borderTop: '1px solid var(--ad-line)',
            marginTop: 16,
          }}>
            <AdminBtn variant="danger" icon={AIcon.trash(13)}>삭제</AdminBtn>
            <div style={{ display: 'flex', gap: 8 }}>
              <AdminBtn>취소</AdminBtn>
              <AdminBtn variant="primary">변경 저장</AdminBtn>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function CatRow({ cat, sel, onSel, idx }) {
  const depth = cat.depth || 0;
  return (
    <div onClick={onSel} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 22px',
      paddingLeft: 22 + depth * 24,
      borderBottom: '1px solid var(--ad-line-soft)',
      background: sel ? '#f8f4fb' : 'transparent',
      borderLeft: `2px solid ${sel ? '#3a2552' : 'transparent'}`,
      cursor: 'pointer',
    }}>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 10,
        color: 'var(--ad-muted)', letterSpacing: '0.08em',
        width: 28,
      }}>{idx}</span>
      <span style={{
        fontSize: 13.5,
        fontWeight: depth === 0 ? 500 : 400,
        color: cat.visible ? 'var(--ad-ink)' : 'var(--ad-muted)',
        flex: 1,
        textDecoration: cat.visible ? 'none' : 'line-through',
      }}>{cat.name}</span>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 11,
        color: 'var(--ad-muted)', letterSpacing: '0.04em',
      }}>{cat.productCount}개</span>
      {!cat.visible && <span style={{
        fontSize: 10, fontFamily: 'var(--mono)',
        padding: '2px 6px', background: '#f1eef5', color: '#6b5d72',
        letterSpacing: '0.1em',
      }}>HIDDEN</span>}
      <button style={rowAction2}>{AIcon.edit(13)}</button>
    </div>
  );
}

// ─── Form helpers ────────────────────────────────────
function FormField({ label, children, hint }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{
        fontSize: 11, color: 'var(--ad-muted)',
        fontFamily: 'var(--mono)', letterSpacing: '0.14em',
        marginBottom: 6, textTransform: 'uppercase',
      }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--ad-muted)', marginTop: 4 }}>{hint}</div>}
    </label>
  );
}
function Input({ value, mono, short, placeholder }) {
  const [v, setV] = useStateV1(value || '');
  return (
    <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} style={{
      width: short ? 100 : '100%',
      padding: '10px 12px',
      border: '1px solid var(--ad-line-strong)',
      background: '#fff',
      fontFamily: mono ? 'var(--mono)' : 'var(--sans)',
      fontSize: 13,
      color: 'var(--ad-ink)',
      outline: 'none',
    }}/>
  );
}
function Select({ value, options }) {
  const [v, setV] = useStateV1(value);
  return (
    <select value={v} onChange={(e) => setV(e.target.value)} style={{
      width: '100%',
      padding: '10px 12px',
      border: '1px solid var(--ad-line-strong)',
      background: '#fff',
      fontFamily: 'var(--sans)',
      fontSize: 13,
      color: 'var(--ad-ink)',
      outline: 'none',
      appearance: 'none',
      backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b5d72\' stroke-width=\'2\'><path d=\'M6 9l6 6 6-6\'/></svg>")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
    }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}
function Textarea({ value }) {
  const [v, setV] = useStateV1(value || '');
  return (
    <textarea value={v} onChange={(e) => setV(e.target.value)} rows={3} style={{
      width: '100%',
      padding: '10px 12px',
      border: '1px solid var(--ad-line-strong)',
      background: '#fff',
      fontFamily: 'var(--sans)',
      fontSize: 13,
      color: 'var(--ad-ink)',
      outline: 'none',
      resize: 'vertical',
      lineHeight: 1.6,
    }}/>
  );
}
function Toggle({ on: defaultOn, label }) {
  const [on, setOn] = useStateV1(defaultOn);
  return (
    <button onClick={() => setOn(!on)} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 0',
      background: 'transparent', border: 'none', cursor: 'pointer',
      fontFamily: 'var(--sans)',
      fontSize: 13,
      color: 'var(--ad-ink)',
    }}>
      <span style={{
        width: 36, height: 20,
        background: on ? '#3a2552' : '#d4cdc0',
        position: 'relative',
        transition: 'background .2s',
        borderRadius: 10,
      }}>
        <span style={{
          position: 'absolute',
          top: 2, left: on ? 18 : 2,
          width: 16, height: 16,
          background: '#fff',
          transition: 'left .2s',
          borderRadius: '50%',
        }}/>
      </span>
      {label}
    </button>
  );
}
function ImageDrop({ label }) {
  return (
    <div style={{
      padding: '18px 16px',
      border: '1px dashed var(--ad-line-strong)',
      background: 'var(--ad-paper-2)',
      textAlign: 'center',
      fontSize: 12,
      color: 'var(--ad-muted)',
    }}>
      <div style={{ fontFamily: 'var(--mono)', letterSpacing: '0.14em', fontSize: 10, marginBottom: 6 }}>DRAG &amp; DROP · OR CLICK</div>
      <div>{label}</div>
    </div>
  );
}

const pageWrap = {
  padding: 24,
  display: 'flex', flexDirection: 'column',
  gap: 16,
};

Object.assign(window, {
  DashboardView, MembersView, CategoriesView,
  FormField, Input, Select, Textarea, Toggle, ImageDrop,
  pageWrap,
});
