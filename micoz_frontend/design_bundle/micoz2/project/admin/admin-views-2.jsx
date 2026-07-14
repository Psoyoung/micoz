// MICOZ Admin — Products / Orders / Sales / Settings views
const { useState: useStateV2 } = React;

// ═══════════════════════════════════════════════════════
// 상품관리
// ═══════════════════════════════════════════════════════
function ProductsView() {
  const D = window.ADMIN_DATA;
  const TREE = D.CATEGORIES_TREE;
  const [tab, setTab] = useStateV2('all');
  const [cat1, setCat1] = useStateV2('all');
  const [cat2, setCat2] = useStateV2('all');
  const [badge, setBadge] = useStateV2('all');
  const [dateFrom, setDateFrom] = useStateV2('');
  const [dateTo, setDateTo] = useStateV2('');
  const [query, setQuery] = useStateV2('');
  const [addOpen, setAddOpen] = useStateV2(false);
  const [editRow, setEditRow] = useStateV2(null);

  // resolve category match
  const sub1 = TREE.find(c => c.id === cat1);
  const allowedCat2 = sub1?.children || [];

  React.useEffect(() => { setCat2('all'); }, [cat1]);

  const cat2Match = (p) => {
    if (cat2 === 'all') return true;
    const target = allowedCat2.find(c => c.id === cat2);
    if (!target) return true;
    return p.category && (p.category === target.name || target.name.includes(p.category));
  };
  const cat1Match = (p) => {
    if (cat1 === 'all') return true;
    if (!sub1) return true;
    // match if product.category matches any sub of cat1 OR cat1 name itself
    if (sub1.name === p.category) return true;
    if (sub1.children?.some(c => c.name === p.category || c.name.includes(p.category))) return true;
    return false;
  };

  const filteredRows = D.ADMIN_PRODUCTS.filter(p => {
    if (tab === 'selling' && p.status !== '판매중')   return false;
    if (tab === 'low'     && p.status !== '재고부족') return false;
    if (tab === 'out'     && p.status !== '품절')     return false;
    if (tab === 'stop'    && p.status !== '판매중지') return false;
    if (!cat1Match(p)) return false;
    if (!cat2Match(p)) return false;
    if (badge !== 'all') {
      const bs = p.badges || [];
      if (!bs.includes(badge)) return false;
    }
    if (dateFrom && p.updated < dateFrom) return false;
    if (dateTo && p.updated > dateTo) return false;
    const q = query.trim().toLowerCase();
    if (q) {
      if (!(p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const STATUS_OPTS = [
    { k: 'all',     l: '전체 상태' },
    { k: 'selling', l: '판매중' },
    { k: 'low',     l: '재고부족' },
    { k: 'out',     l: '품절' },
    { k: 'stop',    l: '판매중지' },
  ];
  const CAT1_OPTS = [
    { k: 'all', l: '전체 1차 카테고리' },
    ...TREE.map(c => ({ k: c.id, l: c.name })),
  ];
  const CAT2_OPTS = [
    { k: 'all', l: cat1 === 'all' ? '1차 카테고리를 먼저 선택' : '전체 2차 카테고리' },
    ...allowedCat2.map(c => ({ k: c.id, l: c.name })),
  ];
  const BADGE_OPTS = [
    { k: 'all', l: '전체 상품 표시' },
    { k: 'BEST', l: 'BEST' },
    { k: 'HIT', l: 'HIT' },
    { k: 'NEW', l: 'NEW' },
    { k: '한정', l: '한정' },
    { k: 'SALE', l: 'SALE' },
  ];

  const reset = () => {
    setTab('all'); setCat1('all'); setCat2('all'); setBadge('all');
    setDateFrom(''); setDateTo(''); setQuery('');
  };

  const filterLabel = {
    display: 'block',
    fontSize: 10.5, color: 'var(--ad-muted)',
    fontFamily: 'var(--mono)', letterSpacing: '0.14em',
    marginBottom: 6, textTransform: 'uppercase',
  };
  const dateInput = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--ad-line-strong)',
    background: '#fff',
    fontFamily: 'var(--mono)',
    fontSize: 12,
    color: 'var(--ad-ink)',
    outline: 'none',
    height: 32,
  };

  return (
    <div style={pageWrap}>
      {/* ─── 검색 카드 ───────────────────────────────── */}
      <Card title="상품 검색" subtitle="SEARCH · FILTER" padding={20}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px 16px',
        }}>
          {/* 검색어 (span 3) */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={filterLabel}>검색어 (상품명 · 상품코드)</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid var(--ad-line-strong)',
              height: 34,
            }}>
              <span style={{ color: 'var(--ad-muted)', display: 'flex' }}>{AIcon.search(14)}</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="상품명 또는 상품코드를 입력하세요"
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
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ad-muted)', display: 'flex', padding: 0 }}
                  title="검색어 지우기"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M6 6l12 12M18 6L6 18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div>
            <div style={filterLabel}>판매 상태</div>
            <AdminDropdown value={tab} onChange={setTab} options={STATUS_OPTS} width={'100%'} />
          </div>
          <div>
            <div style={filterLabel}>1차 카테고리</div>
            <AdminDropdown value={cat1} onChange={setCat1} options={CAT1_OPTS} width={'100%'} />
          </div>
          <div>
            <div style={filterLabel}>2차 카테고리</div>
            <AdminDropdown value={cat2} onChange={setCat2} options={CAT2_OPTS} width={'100%'} />
          </div>

          <div>
            <div style={filterLabel}>상품 표시</div>
            <AdminDropdown value={badge} onChange={setBadge} options={BADGE_OPTS} width={'100%'} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={filterLabel}>등록일자</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={dateInput}/>
              <span style={{ color: 'var(--ad-muted)' }}>—</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={dateInput}/>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 16, paddingTop: 16,
          borderTop: '1px solid var(--ad-line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11,
            color: 'var(--ad-muted)', letterSpacing: '0.04em',
          }}>검색 결과 {filteredRows.length.toLocaleString()}건 / 전체 {D.ADMIN_PRODUCTS.length.toLocaleString()}건</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <AdminBtn onClick={reset}>초기화</AdminBtn>
          </div>
        </div>
      </Card>

      {/* ─── 결과 테이블 ─────────────────────────────── */}
      <Card padding={0}>
        <FilterBar action={
          <>
            <AdminBtn icon={AIcon.download(13)} size="sm">CSV</AdminBtn>
            <AdminBtn icon={AIcon.plus(13)} size="sm" variant="primary" onClick={() => setAddOpen(true)}>상품 등록</AdminBtn>
          </>
        }>
          <div style={{
            fontFamily: 'var(--sans)', fontSize: 12.5,
            color: 'var(--ad-ink)', fontWeight: 500,
          }}>상품 목록</div>
        </FilterBar>

        <DataTable
          rowKey="sku"
          columns={[
            { key: 'sku',      label: '상품코드', mono: true, nowrap: true, render: (v) => <span style={{ color: '#3a2552' }}>{v}</span> },
            { key: 'name',     label: '상품명', render: (v, r) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ProductThumb line={r.line}/>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{v}</div>
              </div>
            )},
            { key: 'category', label: '카테고리', muted: true },
            { key: 'price',    label: '판매가',   align: 'right', mono: true, render: (v) => D.won(v) },
            { key: 'stock',    label: '재고',     align: 'right', mono: true, render: (v, r) => (
              <span style={{
                color: v === 0 ? '#c14d4d' : v < 80 ? '#c08a3a' : 'var(--ad-ink)',
                fontWeight: v < 80 ? 500 : 400,
              }}>{v.toLocaleString()}개</span>
            )},
            { key: 'badges',   label: '상품 표시', render: (v) => (
              (v && v.length > 0) ? (
                <span style={{ display: 'inline-flex', gap: 3, flexWrap: 'wrap' }}>
                  {v.map(b => {
                    const st = ({
                      BEST: { bg: '#3a2552', fg: '#f5edf7' },
                      HIT:  { bg: '#b89968', fg: '#fff' },
                      NEW:  { bg: '#3a8a5a', fg: '#fff' },
                      '한정': { bg: '#a85050', fg: '#fff' },
                      SALE: { bg: '#c08a3a', fg: '#fff' },
                    })[b] || { bg: '#888', fg: '#fff' };
                    return (
                      <span key={b} style={{
                        padding: '2px 6px',
                        background: st.bg, color: st.fg,
                        fontSize: 9.5, fontWeight: 600,
                        letterSpacing: '0.06em',
                        fontFamily: 'var(--sans)',
                      }}>{b}</span>
                    );
                  })}
                </span>
              ) : <span style={{ color: 'var(--ad-muted)' }}>—</span>
            )},
            { key: 'status',   label: '상태', render: (v) => <StatusChip status={v}/> },
            { key: 'updated',  label: '등록일', mono: true, muted: true, nowrap: true },
          ]}
          rows={filteredRows}
          onRowEdit={(r) => setEditRow(r)}
        />
        <Pagination page={1} total={filteredRows.length || 83} pageSize={20} onChange={() => {}}/>
      </Card>
      <ProductFormModal open={addOpen} onClose={() => setAddOpen(false)}/>
      <ProductFormModal open={!!editRow} onClose={() => setEditRow(null)} initial={editRow}/>
    </div>
  );
}

// ─── 상품 등록/수정 모달 ──────────────────────────────
function ProductFormModal({ open, onClose, initial }) {
  const D = window.ADMIN_DATA;
  const TREE = D.CATEGORIES_TREE;
  const isEdit = !!initial;

  // build initial form state
  const buildInitialForm = () => {
    if (initial) {
      // find category tree match for initial.category
      let cat1 = TREE[0]?.id || '';
      let cat2 = '';
      for (const p of TREE) {
        if (p.children?.some(c => c.name === initial.category || c.name.includes(initial.category))) {
          cat1 = p.id;
          const match = p.children.find(c => c.name === initial.category || c.name.includes(initial.category));
          cat2 = match?.id || '';
          break;
        }
        if (p.name === initial.category) { cat1 = p.id; break; }
      }
      return {
        sku: initial.sku || '',
        name: initial.name || '',
        cat1, cat2,
        price: initial.price?.toString() || '',
        stock: initial.stock?.toString() || '',
        status: initial.status || '판매중',
        badges: initial.badges || [],
        description: initial.description || '',
      };
    }
    return {
      sku: '', name: '',
      cat1: TREE[0]?.id || '',
      cat2: TREE[0]?.children?.[0]?.id || '',
      price: '', stock: '',
      status: '판매중',
      badges: [],
      description: '',
    };
  };

  const [form, setForm] = useStateV2(buildInitialForm);
  const [mainImage, setMainImage] = useStateV2(null);
  const [detailImages, setDetailImages] = useStateV2([]);
  const [previewOn, setPreviewOn] = useStateV2(false);
  const mainInputRef = React.useRef(null);
  const detailInputRef = React.useRef(null);

  // Reset form whenever the modal is (re)opened with a (possibly different) row
  React.useEffect(() => {
    if (open) {
      setForm(buildInitialForm());
      setMainImage(null);
      setDetailImages([]);
      setPreviewOn(false);
    }
    // eslint-disable-next-line
  }, [open, initial?.sku]);

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

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setCat1 = (id) => {
    const p = TREE.find(c => c.id === id);
    setForm(prev => ({ ...prev, cat1: id, cat2: p?.children?.[0]?.id || '' }));
  };
  const currentParent = TREE.find(c => c.id === form.cat1);
  const subCats = currentParent?.children || [];

  const handleMain = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setMainImage({ name: f.name, size: f.size, url });
  };
  const handleDetail = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = files.map(f => ({ name: f.name, size: f.size, url: URL.createObjectURL(f) }));
    setDetailImages(prev => [...prev, ...next]);
    e.target.value = '';
  };
  const removeDetail = (i) => setDetailImages(prev => prev.filter((_, idx) => idx !== i));

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
  const monoField = { ...fieldStyle, fontFamily: 'var(--mono)' };
  const labelStyle = {
    display: 'block',
    fontSize: 11, color: 'var(--ad-muted)',
    fontFamily: 'var(--mono)', letterSpacing: '0.14em',
    marginBottom: 6, textTransform: 'uppercase',
  };
  const STATUS = ['판매중', '재고부족', '품절', '판매중지'];

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
          width: 'min(880px, 100%)',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)',
          border: '1px solid var(--ad-line-strong)',
        }}
      >
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 26px',
          borderBottom: '1px solid var(--ad-line)',
          flexShrink: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 11, color: 'var(--ad-muted)',
              fontFamily: 'var(--mono)', letterSpacing: '0.18em',
              marginBottom: 4,
            }}>{isEdit ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</div>
            <div style={{
              fontFamily: 'var(--serif)', fontSize: 20,
              fontWeight: 500, color: 'var(--ad-ink)',
            }}>{isEdit ? '상품 수정' : '상품 등록'}</div>
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
        <div style={{ padding: 26, overflowY: 'auto', flex: 1, position: 'relative' }}>
          {previewOn && (
            <ProductPreviewView
              form={form}
              mainImage={mainImage}
              detailImages={detailImages}
              isEdit={isEdit}
            />
          )}
          {/* 기본 정보 */}
          <div style={{
            fontSize: 11, color: 'var(--ad-muted)',
            fontFamily: 'var(--mono)', letterSpacing: '0.14em',
            marginBottom: 14, textTransform: 'uppercase',
            paddingBottom: 8,
            borderBottom: '1px solid var(--ad-line)',
          }}>기본 정보</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 18px', marginBottom: 24 }}>
            <div>
              <div style={labelStyle}>상품코드 <span style={{ color: '#a05a5a' }}>*</span></div>
              <input
                style={monoField}
                placeholder="BIE-ES-050"
                value={form.sku}
                onChange={(e) => setField('sku', e.target.value.toUpperCase())}
                required/>
            </div>
            <div>
              <div style={labelStyle}>상품명 <span style={{ color: '#a05a5a' }}>*</span></div>
              <input
                style={fieldStyle}
                placeholder="비온 에센스 50ml"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                required/>
            </div>
            <div>
              <div style={labelStyle}>1차 카테고리 <span style={{ color: '#a05a5a' }}>*</span></div>
              <AdminDropdown
                value={form.cat1}
                onChange={setCat1}
                options={TREE.map(c => ({ k: c.id, l: c.name }))}
                width={'100%'}
              />
            </div>
            <div>
              <div style={labelStyle}>2차 카테고리</div>
              <AdminDropdown
                value={form.cat2 || '__none'}
                onChange={(v) => setField('cat2', v === '__none' ? '' : v)}
                options={subCats.length === 0
                  ? [{ k: '__none', l: '하위 카테고리 없음' }]
                  : subCats.map(c => ({ k: c.id, l: c.name }))
                }
                width={'100%'}
              />
            </div>
            <div>
              <div style={labelStyle}>판매가 (₩) <span style={{ color: '#a05a5a' }}>*</span></div>
              <input
                type="number" min="0" step="1000"
                style={monoField}
                placeholder="138000"
                value={form.price}
                onChange={(e) => setField('price', e.target.value)}
                required/>
            </div>
            <div>
              <div style={labelStyle}>재고 (개)</div>
              <input
                type="number" min="0"
                style={monoField}
                placeholder="0"
                value={form.stock}
                onChange={(e) => setField('stock', e.target.value)}/>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>판매 상태</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUS.map(s => {
                  const active = form.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setField('status', s)}
                      style={{
                        padding: '8px 14px',
                        background: active ? '#3a2552' : '#fff',
                        color: active ? '#f5f1ea' : 'var(--ad-ink)',
                        border: `1px solid ${active ? '#3a2552' : 'var(--ad-line-strong)'}`,
                        cursor: 'pointer',
                        fontFamily: 'var(--sans)',
                        fontSize: 12,
                      }}>{s}</button>
                  );
                })}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>상품 표시</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { k: 'BEST', bg: '#3a2552', fg: '#f5edf7' },
                  { k: 'HIT',  bg: '#b89968', fg: '#fff' },
                  { k: 'NEW',  bg: '#3a8a5a', fg: '#fff' },
                  { k: '한정', bg: '#a85050', fg: '#fff' },
                  { k: 'SALE', bg: '#c08a3a', fg: '#fff' },
                ].map(b => {
                  const active = (form.badges || []).includes(b.k);
                  return (
                    <button
                      key={b.k}
                      type="button"
                      onClick={() => setField('badges',
                        active
                          ? form.badges.filter(x => x !== b.k)
                          : [...(form.badges || []), b.k]
                      )}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px 8px 10px',
                        background: active ? '#fff' : '#fff',
                        color: 'var(--ad-ink)',
                        border: `1px solid ${active ? '#3a2552' : 'var(--ad-line-strong)'}`,
                        cursor: 'pointer',
                        fontFamily: 'var(--sans)',
                        fontSize: 12,
                      }}>
                      <span style={{
                        width: 14, height: 14,
                        background: active ? '#3a2552' : 'transparent',
                        border: `1.5px solid ${active ? '#3a2552' : 'var(--ad-line-strong)'}`,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {active && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <path d="M5 12l5 5L20 7"/>
                          </svg>
                        )}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        background: b.bg, color: b.fg,
                        fontSize: 10.5, fontWeight: 600,
                        letterSpacing: '0.06em',
                        fontFamily: 'var(--sans)',
                      }}>{b.k}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{
                marginTop: 8, fontSize: 11, color: 'var(--ad-muted)',
                letterSpacing: '0.02em',
              }}>상품 카드 위에 노출되는 라벨입니다. 복수 선택 가능합니다.</div>
            </div>
          </div>

          {/* 메인 사진 */}
          <div style={{
            fontSize: 11, color: 'var(--ad-muted)',
            fontFamily: 'var(--mono)', letterSpacing: '0.14em',
            marginBottom: 14, textTransform: 'uppercase',
            paddingBottom: 8,
            borderBottom: '1px solid var(--ad-line)',
          }}>메인 사진</div>

          <div style={{ marginBottom: 24 }}>
            <input
              ref={mainInputRef}
              type="file"
              accept="image/*"
              onChange={handleMain}
              style={{ display: 'none' }}
            />
            {!mainImage ? (
              <button
                type="button"
                onClick={() => mainInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '32px 16px',
                  background: 'var(--ad-paper-2)',
                  border: '1px dashed var(--ad-line-strong)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  color: 'var(--ad-muted)',
                }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <rect x="3" y="4" width="18" height="16"/>
                  <path d="M3 16l5-5 4 4 3-3 6 6"/>
                  <circle cx="9" cy="9" r="1.5"/>
                </svg>
                <span style={{ fontSize: 13 }}>대표 이미지 업로드</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>JPG · PNG · 권장 1200×1500</span>
              </button>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: 14,
                border: '1px solid var(--ad-line)',
                background: 'var(--ad-paper-2)',
              }}>
                <img src={mainImage.url} alt="" style={{
                  width: 96, height: 120, objectFit: 'cover', flexShrink: 0,
                  border: '1px solid var(--ad-line-strong)',
                }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>{mainImage.name}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ad-muted)', marginTop: 4 }}>
                    {(mainImage.size / 1024).toFixed(1)} KB
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <AdminBtn size="sm" onClick={() => mainInputRef.current?.click()}>변경</AdminBtn>
                    <AdminBtn size="sm" variant="danger" onClick={() => { URL.revokeObjectURL(mainImage.url); setMainImage(null); }}>제거</AdminBtn>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 상세 페이지 */}
          <div style={{
            fontSize: 11, color: 'var(--ad-muted)',
            fontFamily: 'var(--mono)', letterSpacing: '0.14em',
            marginBottom: 14, textTransform: 'uppercase',
            paddingBottom: 8,
            borderBottom: '1px solid var(--ad-line)',
          }}>상세 페이지</div>

          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>상품 설명</div>
            <textarea
              style={{ ...fieldStyle, minHeight: 110, resize: 'vertical', lineHeight: 1.55 }}
              placeholder="제품 특징, 사용법, 주요 성분 등을 자유롭게 작성하세요."
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>

          <div>
            <div style={labelStyle}>상세 이미지 ({detailImages.length}장)</div>
            <input
              ref={detailInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleDetail}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {detailImages.map((img, i) => (
                <div key={i} style={{
                  position: 'relative',
                  width: 96, height: 120,
                  border: '1px solid var(--ad-line-strong)',
                }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  <button
                    type="button"
                    onClick={() => removeDetail(i)}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 22, height: 22,
                      background: 'rgba(15,10,28,0.78)',
                      color: '#f5f1ea',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="제거"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M18 6L6 18"/>
                    </svg>
                  </button>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0,
                    background: 'rgba(15,10,28,0.78)',
                    color: '#f5f1ea',
                    padding: '2px 6px',
                    fontFamily: 'var(--mono)', fontSize: 10,
                    letterSpacing: '0.04em',
                  }}>{i + 1}</div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => detailInputRef.current?.click()}
                style={{
                  width: 96, height: 120,
                  background: 'var(--ad-paper-2)',
                  border: '1px dashed var(--ad-line-strong)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  color: 'var(--ad-muted)',
                  fontSize: 11,
                  fontFamily: 'var(--mono)', letterSpacing: '0.04em',
                }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                추가
              </button>
            </div>
          </div>
        </div>

        {/* footer */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 8,
          padding: '16px 26px',
          borderTop: '1px solid var(--ad-line)',
          background: 'var(--ad-paper-2)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setPreviewOn(p => !p)}
              style={{
                padding: '8px 14px',
                background: previewOn ? '#3a2552' : '#fff',
                color: previewOn ? '#f5f1ea' : 'var(--ad-ink)',
                border: `1px solid ${previewOn ? '#3a2552' : 'var(--ad-line-strong)'}`,
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                fontSize: 12.5,
                letterSpacing: '0.02em',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {previewOn ? '편집으로' : '미리보기'}
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`"${form.name || form.sku}" 상품을 정말 삭제하시겠습니까?`)) {
                    onClose();
                  }
                }}
                style={{
                  padding: '8px 18px',
                  background: '#fff',
                  color: '#a8322c',
                  border: '1px solid #d8b0aa',
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  fontSize: 12.5,
                  letterSpacing: '0.02em',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#a8322c';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = '#a8322c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.color = '#a8322c';
                  e.currentTarget.style.borderColor = '#d8b0aa';
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>
                </svg>
                상품 삭제
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <AdminBtn onClick={onClose}>취소</AdminBtn>
            <button type="submit" style={{
              padding: '8px 18px',
              background: '#3a2552', color: '#f5f1ea',
              border: '1px solid #3a2552',
              cursor: 'pointer',
              fontFamily: 'var(--sans)',
              fontSize: 12.5,
              letterSpacing: '0.02em',
            }}>{isEdit ? '수정 저장' : '상품 등록'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ProductThumb({ line }) {
  const grads = {
    '비온': 'linear-gradient(155deg, #2a1a3e 0%, #4d3470 45%, #9a7fb8 100%)',
    '제린': 'linear-gradient(165deg, #18102a 0%, #3a2552 50%, #6b4d8f 100%)',
    '루안': 'linear-gradient(140deg, #221638 0%, #4d3470 60%, #c4b0d8 100%)',
    '단아': 'linear-gradient(170deg, #4d3470 0%, #9a7fb8 50%, #e8d8f0 100%)',
    '여원': 'linear-gradient(150deg, #2a1a3e 0%, #6b4d8f 100%)',
    '소단': 'linear-gradient(160deg, #18102a 0%, #221638 40%, #4d3470 100%)',
    '청아': 'linear-gradient(180deg, #6b4d8f 0%, #c4b0d8 60%, #f5edf7 100%)',
    '아담': 'linear-gradient(155deg, #221638 0%, #3a2552 50%, #9a7fb8 100%)',
    '아카이브': 'linear-gradient(155deg, #4a4047 0%, #8a7a85 100%)',
  };
  return (
    <div style={{
      width: 38, height: 46,
      background: grads[line] || grads['비온'],
      flexShrink: 0,
      position: 'relative',
      borderRadius: 1,
    }}>
      <div style={{
        position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
        width: 16, height: 4, background: 'rgba(20,12,30,0.8)', borderRadius: 1,
      }}/>
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        width: 22, height: 30,
        border: '1px solid rgba(255,255,255,0.18)',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.14), rgba(0,0,0,0.18))',
        borderRadius: 2,
      }}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 주문관리
// ═══════════════════════════════════════════════════════
function OrdersView() {
  const D = window.ADMIN_DATA;
  const [tab, setTab] = useStateV2('all');
  const [openOrder, setOpenOrder] = useStateV2(null);
  return (
    <div style={pageWrap}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {[
          { label: '오늘 주문', value: '84', sub: '결제완료 78건', accent: '#3a2552' },
          { label: '결제 대기', value: '6', sub: '24h 경과 2건', accent: '#c08a3a' },
          { label: '배송 준비', value: '23', sub: '오늘 출고 대상', accent: '#6b4d8f' },
          { label: '배송 중',   value: '142', sub: '평균 1.8일', accent: '#3a6dbf' },
          { label: '배송 완료', value: '2,418', sub: '이번 달 누적', accent: '#3a8a5a' },
          { label: '취소/환불', value: '12', sub: '취소율 0.8%', accent: '#a85050' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff',
            border: '1px solid var(--ad-line)',
            padding: '16px 18px',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: 24, height: 2, background: s.accent,
            }}/>
            <div style={{ fontSize: 10.5, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--serif-en)', fontSize: 26, marginTop: 6 }}>{s.value}<span style={{ fontSize: 13, color: 'var(--ad-muted)', marginLeft: 4 }}>건</span></div>
            <div style={{ fontSize: 10.5, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.04em', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <Card padding={0}>
        <FilterBar action={
          <>
            <AdminBtn icon={AIcon.download(13)} size="sm">송장 인쇄</AdminBtn>
            <AdminBtn icon={AIcon.download(13)} size="sm">CSV 내보내기</AdminBtn>
          </>
        }>
          <FilterChip label="전체" value={D.ORDERS.length} active={tab === 'all'} onClick={() => setTab('all')}/>
          <FilterChip label="결제완료" value={11} active={tab === 'paid'} onClick={() => setTab('paid')}/>
          <FilterChip label="입금대기" value={1} active={tab === 'wait'} onClick={() => setTab('wait')}/>
          <FilterChip label="배송중" value={3} active={tab === 'ship'} onClick={() => setTab('ship')}/>
          <FilterChip label="취소/환불" value={2} active={tab === 'cancel'} onClick={() => setTab('cancel')}/>
          <span style={{ width: 1, height: 22, background: 'var(--ad-line)', margin: '0 4px' }}/>
          <DateRangeField/>
        </FilterBar>

        <DataTable
          rowKey="id"
          columns={[
            { key: 'id',       label: '주문번호', mono: true, nowrap: true, render: (v) => <span style={{ color: '#3a2552', fontWeight: 500 }}>{v}</span> },
            { key: 'date',     label: '주문일시', mono: true, muted: true, nowrap: true },
            { key: 'customer', label: '고객', render: (v) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'linear-gradient(155deg, #3a2552, #9a7fb8)',
                  color: '#f5f1ea', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--serif-en)', fontSize: 10,
                }}>{v[0]}</span>
                <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{v}</span>
              </div>
            )},
            { key: 'items',    label: '상품', align: 'right', mono: true, render: (v) => v + '개' },
            { key: 'amount',   label: '결제금액', align: 'right', mono: true, nowrap: true, render: (v) => (
              <span style={{ fontWeight: 500 }}>{D.won(v)}</span>
            )},
            { key: 'payment',  label: '결제수단', muted: true },
            { key: 'status',   label: '결제상태', render: (v) => <StatusChip status={v}/> },
            { key: 'shipping', label: '배송상태', render: (v) => <StatusChip status={v}/> },
          ]}
          rows={D.ORDERS}
          onRowClick={(r) => setOpenOrder(r)}
        />
        <Pagination page={1} total={84} pageSize={20} onChange={() => {}}/>
      </Card>

      <OrderDetailModal order={openOrder} onClose={() => setOpenOrder(null)}/>
    </div>
  );
}

// ─── Order detail modal ─────────────────────────────
function OrderDetailModal({ order, onClose }) {
  const D = window.ADMIN_DATA;
  React.useEffect(() => {
    if (!order) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [order, onClose]);
  if (!order) return null;

  // mock 상품 라인업 — 주문 items 수만큼 결정적 생성
  const POOL = [
    { sku: 'BIE-ES-050', name: '비온 에센스 50ml', price: 138000, line: '비온' },
    { sku: 'JER-SE-030', name: '제린 세럼 30ml',   price: 168000, line: '제린' },
    { sku: 'LUA-CR-050', name: '루안 크림 50ml',   price: 198000, line: '루안' },
    { sku: 'DAN-TO-150', name: '단아 토너 150ml',  price:  78000, line: '단아' },
    { sku: 'YEO-CL-180', name: '여원 클렌저 180ml',price:  58000, line: '여원' },
    { sku: 'SOD-MS-PK5', name: '소단 마스크 5팩',  price:  38000, line: '소단' },
    { sku: 'CHE-MI-080', name: '청아 미스트 80ml', price:  48000, line: '청아' },
    { sku: 'ADA-EY-020', name: '아담 아이크림 20ml', price: 128000, line: '아담' },
  ];
  const seed = parseInt(order.id.slice(-4), 10) || 0;
  const items = [];
  for (let i = 0; i < Math.max(1, order.items); i++) {
    const p = POOL[(seed + i * 3) % POOL.length];
    const qty = (i === order.items - 1) ? Math.max(1, order.items - i) : 1;
    items.push({ ...p, qty });
  }
  const subtotal = items.reduce((a, b) => a + b.price * b.qty, 0);
  const shippingFee = order.amount >= 50000 ? 0 : 3000;
  const discount = Math.max(0, subtotal + shippingFee - order.amount);

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
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff',
        width: 'min(960px, 100%)',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)',
        border: '1px solid var(--ad-line-strong)',
      }}>
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
            }}>ORDER DETAIL</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 17,
                fontWeight: 500, color: '#3a2552',
              }}>{order.id}</span>
              <StatusChip status={order.status}/>
              <StatusChip status={order.shipping}/>
            </div>
            <div style={{
              fontSize: 11.5, color: 'var(--ad-muted)',
              fontFamily: 'var(--mono)', letterSpacing: '0.04em',
              marginTop: 6,
            }}>{order.date} · {order.customer} · {order.payment}</div>
          </div>
          <button onClick={onClose} style={{
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
        }}>
          <div style={{ padding: 26, borderRight: '1px solid var(--ad-line)' }}>
            <div style={{
              fontSize: 11, color: 'var(--ad-muted)',
              fontFamily: 'var(--mono)', letterSpacing: '0.14em',
              marginBottom: 12, textTransform: 'uppercase',
            }}>주문 상품 ({order.items})</div>
            {items.map((it, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 0',
                borderBottom: '1px solid var(--ad-line-soft)',
              }}>
                <ProductThumb line={it.line}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{it.name}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ad-muted)', letterSpacing: '0.06em', marginTop: 2 }}>{it.sku}</div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, whiteSpace: 'nowrap' }}>{it.qty}개</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, width: 100, textAlign: 'right', whiteSpace: 'nowrap' }}>{D.won(it.price * it.qty)}</div>
              </div>
            ))}
            <div style={{ paddingTop: 14, marginTop: 6 }}>
              {[
                ['상품금액',  D.won(subtotal)],
                ['배송비',    shippingFee === 0 ? '₩0  (무료배송)' : D.won(shippingFee)],
                ...(discount > 0 ? [['쿠폰 할인', '−' + D.won(discount)]] : []),
                ['최종 결제', D.won(order.amount), true],
              ].map(([k, v, em], i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0',
                  fontSize: em ? 14 : 12.5,
                  fontWeight: em ? 600 : 400,
                  borderTop: em ? '1px solid var(--ad-line)' : 'none',
                  marginTop: em ? 8 : 0,
                  paddingTop: em ? 12 : 6,
                }}>
                  <span style={{ color: em ? 'var(--ad-ink)' : 'var(--ad-muted)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 26 }}>
            <div style={{
              fontSize: 11, color: 'var(--ad-muted)',
              fontFamily: 'var(--mono)', letterSpacing: '0.14em',
              marginBottom: 12, textTransform: 'uppercase',
            }}>배송 · 결제</div>
            <KV label="수령인" value={`${order.customer} (010-${String(1000 + seed).slice(0,4)}-${String(2000 + seed).slice(0,4)})`}/>
            <KV label="주소" value="서울특별시 성동구 성수이로 89, 미코즈빌딩 4층 (성수동2가)"/>
            <KV label="우편번호" value="04781" mono/>
            <KV label="배송 메모" value="부재 시 경비실 보관 부탁드립니다"/>
            <KV label="결제수단" value={order.payment + ' — 신한 1234-****-****-' + String(5000 + seed).slice(0,4)}/>
            <KV label="승인번호" value={'A-' + order.id.replace(/-/g, '') + '-' + (1000 + seed)} mono/>

            <div style={{
              display: 'flex', gap: 8, flexWrap: 'wrap',
              marginTop: 18, paddingTop: 16,
              borderTop: '1px solid var(--ad-line)',
            }}>
              <AdminBtn variant="primary">배송 시작</AdminBtn>
              <AdminBtn>송장 출력</AdminBtn>
              <AdminBtn variant="danger">주문 취소</AdminBtn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KV({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', padding: '6px 0', fontSize: 12.5 }}>
      <span style={{ width: 90, color: 'var(--ad-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, fontFamily: mono ? 'var(--mono)' : 'var(--sans)', lineHeight: 1.5 }}>{value}</span>
    </div>
  );
}

function DateRangeField() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 12px',
      background: '#fff',
      border: '1px solid var(--ad-line-strong)',
      fontFamily: 'var(--mono)', fontSize: 11.5,
      color: 'var(--ad-ink)',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ whiteSpace: 'nowrap' }}>2026-05-13</span>
      <span style={{ color: 'var(--ad-muted)' }}>→</span>
      <span style={{ whiteSpace: 'nowrap' }}>2026-05-20</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 매출관리
// ═══════════════════════════════════════════════════════
function SalesView() {
  const D = window.ADMIN_DATA;
  const total = D.SALES_30D.reduce((a, b) => a + b.amount, 0);
  return (
    <div style={pageWrap}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Stat label="월간 매출 (5월)" value={D.wonM(total)} sub="목표 ₩520M (95%)" delta="+11.2%" deltaPositive accent="#3a2552"/>
        <Stat label="총 주문" value="2,148건" sub="평균 ₩186,420" delta="+8.4%" deltaPositive accent="#6b4d8f"/>
        <Stat label="결제 대비 환불률" value="0.82%" sub="업계 평균 2.1%" delta="−0.3pp" deltaPositive accent="#b89968"/>
        <Stat label="객단가" value="₩186k" sub="상무 평균 ₩412k" delta="+4.8%" deltaPositive accent="#9a7fb8"/>
      </div>

      {/* 매출 추이 */}
      <Card title="일별 매출 · 주문" subtitle="2026 MAY · 일자별" padding={0}
        action={<div style={{ display: 'flex', gap: 8 }}>
          <FilterChip label="일" active/>
          <FilterChip label="주"/>
          <FilterChip label="월"/>
          <AdminBtn icon={AIcon.download(13)} size="sm">리포트 다운로드</AdminBtn>
        </div>}
      >
        <SalesDualChart data={D.SALES_30D}/>
      </Card>

      {/* 라인별 / 채널별 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        <Card title="라인별 매출" subtitle="LINE PERFORMANCE · 30D" padding={22}>
          {D.SALES_BY_LINE.map((l, i) => (
            <BarRow key={l.line}
              label={l.line + ' 라인'}
              value={l.amount}
              max={D.SALES_BY_LINE[0].amount}
              format={(v) => D.wonM(v) + ' · ' + l.share + '%'}
              color={['#3a2552','#6b4d8f','#9a7fb8','#b89968','#c4b0d8','#d8c0e8','#ede7dc'][i]}
            />
          ))}
        </Card>

        <Card title="채널별 매출" subtitle="CHANNEL · 30D" padding={22}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <Donut data={D.SALES_BY_CHANNEL} size={200} thickness={26}
              centerLabel="총매출" centerValue={D.wonM(D.SALES_BY_CHANNEL.reduce((a, b) => a + b.amount, 0))}/>
            <div style={{ flex: 1, fontSize: 12 }}>
              {D.SALES_BY_CHANNEL.map((c) => (
                <div key={c.ch} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--ad-line-soft)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, background: c.color }}/>
                    <span style={{ whiteSpace: 'nowrap' }}>{c.ch}</span>
                  </span>
                  <span style={{ fontFamily: 'var(--mono)' }}>{D.wonM(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* 시간대별 히트맵 + Top 상품 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: 16,
      }}>
        <Card title="시간대 × 요일 매출 히트맵" subtitle="WHEN PEOPLE BUY · 최근 4주" padding={22}>
          <Heatmap/>
        </Card>

        <Card title="베스트셀러" subtitle="TOP 5 · 30D" padding={0}>
          <div>
            {D.TOP_PRODUCTS_30D.map((p, i) => (
              <div key={p.name} style={{
                padding: '16px 22px',
                borderBottom: '1px solid var(--ad-line-soft)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <span style={{
                  fontFamily: 'var(--serif-en)', fontSize: 22,
                  color: 'var(--ad-muted)', width: 28,
                }}>{String(i+1).padStart(2,'0')}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', marginTop: 2, letterSpacing: '0.06em' }}>{p.units}개 판매</div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{D.wonM(p.amount)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SalesDualChart({ data }) {
  const w = 1100, h = 280, pad = { l: 60, r: 60, t: 24, b: 32 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const maxAmt = Math.max(...data.map(d => d.amount));
  const maxOrd = Math.max(...data.map(d => d.orders));
  const barW = iw / data.length * 0.62;
  const xs = (i) => pad.l + (i + 0.5) * (iw / data.length);
  const ya = (v) => pad.t + ih - (v / maxAmt) * ih;
  const yo = (v) => pad.t + ih - (v / maxOrd) * ih;
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
                style={{ fontFamily: 'var(--mono)', fontSize: 10, fill: '#8a7ba0' }}>
                {D.wonM(maxAmt * f)}
              </text>
              <text x={w - pad.r + 8} y={y + 3} textAnchor="start"
                style={{ fontFamily: 'var(--mono)', fontSize: 10, fill: '#b89968' }}>
                {Math.round(maxOrd * f)}
              </text>
            </g>
          );
        })}
        {/* bars (revenue) */}
        {data.map((d, i) => (
          <rect key={i}
            x={xs(i) - barW / 2}
            y={ya(d.amount)}
            width={barW}
            height={pad.t + ih - ya(d.amount)}
            fill="#6b4d8f"
            opacity={i === data.length - 1 ? 1 : 0.78}
          />
        ))}
        {/* orders line */}
        <path d={data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)} ${yo(d.orders)}`).join(' ')}
          fill="none" stroke="#b89968" strokeWidth="2"/>
        {data.map((d, i) => (
          <circle key={i} cx={xs(i)} cy={yo(d.orders)} r="2.5" fill="#b89968"/>
        ))}
        {/* x ticks */}
        {data.filter((_, i) => i % 4 === 0 || i === data.length - 1).map((d) => {
          const i = data.indexOf(d);
          return (
            <text key={i} x={xs(i)} y={h - 10} textAnchor="middle"
              style={{ fontFamily: 'var(--mono)', fontSize: 10, fill: '#8a7ba0' }}>
              5/{String(d.day).padStart(2,'0')}
            </text>
          );
        })}
        {/* legend */}
        <g transform={`translate(${pad.l}, 8)`}>
          <rect width="10" height="10" fill="#6b4d8f"/>
          <text x="16" y="9" style={{ fontFamily: 'var(--mono)', fontSize: 10, fill: '#1a1424', letterSpacing: '0.06em' }}>매출 (KRW)</text>
          <line x1="120" x2="138" y1="5" y2="5" stroke="#b89968" strokeWidth="2"/>
          <circle cx="129" cy="5" r="2.5" fill="#b89968"/>
          <text x="146" y="9" style={{ fontFamily: 'var(--mono)', fontSize: 10, fill: '#1a1424', letterSpacing: '0.06em' }}>주문 수</text>
        </g>
      </svg>
    </div>
  );
}

function Heatmap() {
  // 7 weekdays × 12 (8:00 ~ 20:00 분단위) 24개 칸 → 단순화: 7 × 14
  const HOURS = ['8','9','10','11','12','13','14','15','16','17','18','19','20','21'];
  const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
  const seed = (d, h) => {
    const base = Math.sin((d * 13 + h * 7)) * 0.5 + 0.5;
    const morning = h < 11 ? 0.2 : 1;
    const evening = h >= 18 && h <= 21 ? 1.4 : 1;
    const weekend = d >= 5 ? 1.2 : 1;
    return Math.min(1, base * morning * evening * weekend);
  };
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 24, paddingBottom: 6 }}>
        {DAYS.map(d => (
          <span key={d} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ad-muted)', letterSpacing: '0.04em', height: 24, display: 'flex', alignItems: 'center' }}>{d}</span>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${HOURS.length}, 1fr)`, gap: 3, marginBottom: 4 }}>
          {HOURS.map(h => (
            <span key={h} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ad-muted)', textAlign: 'center', letterSpacing: '0.04em' }}>{h}</span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {DAYS.map((d, di) => (
            <div key={d} style={{ display: 'grid', gridTemplateColumns: `repeat(${HOURS.length}, 1fr)`, gap: 3 }}>
              {HOURS.map((h, hi) => {
                const v = seed(di, hi);
                return (
                  <div key={h} style={{
                    height: 24,
                    background: `rgba(58, 37, 82, ${v * 0.9 + 0.06})`,
                    borderRadius: 1,
                  }}/>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 14, fontSize: 11, color: 'var(--ad-muted)',
          fontFamily: 'var(--mono)', letterSpacing: '0.06em',
        }}>
          낮음
          {[0.1, 0.25, 0.45, 0.65, 0.9].map((a, i) => (
            <span key={i} style={{ width: 18, height: 10, background: `rgba(58, 37, 82, ${a})` }}/>
          ))}
          높음
          <span style={{ marginLeft: 'auto' }}>피크: 금 21:00 — 일일 평균 대비 +184%</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 시스템 설정
// ═══════════════════════════════════════════════════════
// ─── 메인 화면 설정 ────────────────────────────────────
function SettingsMain() {
  const HERO_GRADS = [
    'linear-gradient(155deg, #2a1a3e 0%, #4d3470 45%, #9a7fb8 100%)',
    'linear-gradient(165deg, #18102a 0%, #3a2552 50%, #6b4d8f 100%)',
    'linear-gradient(140deg, #221638 0%, #4d3470 60%, #c4b0d8 100%)',
  ];
  const [slides, setSlides] = useStateV2([
    { id: 1, title: '깊은 밤, 보랏빛 정수',  sub: '비온 에센스 신상 컬렉션',  cta: '컬렉션 보기',    link: '/collections/bion',     active: true,  start: '2026-05-01', end: '2026-06-30' },
    { id: 2, title: '제린 세럼 30% OFF',     sub: '5월 한정 멤버스 프로모션', cta: '지금 구매하기',  link: '/promo/jerin-may',      active: true,  start: '2026-05-15', end: '2026-05-31' },
    { id: 3, title: '여름을 준비하는 클렌징', sub: '여원 클렌저 리뉴얼 출시',  cta: '자세히 보기',    link: '/products/yeowon-clean', active: false, start: '2026-06-10', end: '2026-07-10' },
  ]);
  const [addOpen, setAddOpen] = useStateV2(false);
  const containerRef = React.useRef(null);

  const move = (i, dir) => {
    setSlides(prev => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const remove = (i) => setSlides(prev => prev.filter((_, idx) => idx !== i));
  const toggle = (i) => setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, active: !s.active } : s));
  const update = (i, k, v) => setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  const handleAdded = (data) => {
    const id = Date.now();
    setSlides(prev => [...prev, { id, active: true, ...data }]);
    setAddOpen(false);
    // 새 카드로 살짝 강조 스크롤
    setTimeout(() => {
      const el = containerRef.current?.querySelector(`[data-slide-id="${id}"]`);
      if (el) {
        el.style.transition = 'box-shadow .3s';
        el.style.boxShadow = '0 0 0 2px #3a2552';
        setTimeout(() => { el.style.boxShadow = ''; }, 1200);
      }
    }, 50);
  };

  return (
    <div style={pageWrap}>
      <Card title="메인 히어로 배너" subtitle="HERO · 쇼핑몰 첫 화면 슬라이드" padding={0}
        action={<AdminBtn variant="primary" icon={AIcon.plus(13)} size="sm" onClick={() => setAddOpen(true)}>배너 추가</AdminBtn>}
      >
        <div ref={containerRef} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {slides.map((s, i) => (
            <div key={s.id} data-slide-id={s.id} style={{
              display: 'grid', gridTemplateColumns: '220px 1fr auto', gap: 18,
              alignItems: 'stretch',
              padding: 16,
              background: s.active ? '#fff' : 'var(--ad-paper-2)',
              border: '1px solid var(--ad-line-strong)',
              opacity: s.active ? 1 : 0.78,
            }}>
              {/* 미리보기 */}
              <div style={{
                position: 'relative',
                background: HERO_GRADS[i % HERO_GRADS.length],
                color: '#f5f1ea',
                padding: '20px 18px',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                minHeight: 130,
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 8, left: 10,
                  fontFamily: 'var(--mono)', fontSize: 9,
                  letterSpacing: '0.18em', opacity: 0.7,
                }}>SLIDE · {String(i+1).padStart(2,'0')}</div>
                <div style={{
                  fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500,
                  lineHeight: 1.3, marginBottom: 4,
                }}>{s.title || '제목 없음'}</div>
                <div style={{ fontSize: 11.5, opacity: 0.8, lineHeight: 1.4 }}>{s.sub}</div>
              </div>

              {/* 폼 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <MiniLabel>제목</MiniLabel>
                  <MiniInput value={s.title} onChange={(v) => update(i, 'title', v)}/>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <MiniLabel>설명</MiniLabel>
                  <MiniInput value={s.sub} onChange={(v) => update(i, 'sub', v)}/>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <MiniLabel>대표 이미지</MiniLabel>
                  <div style={{
                    padding: '8px 12px',
                    border: '1px dashed var(--ad-line-strong)',
                    background: 'var(--ad-paper-2)',
                    fontSize: 12, color: 'var(--ad-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}>
                    <span style={{ fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>hero-slide-{String(i+1).padStart(2,'0')}.jpg · 2560×1080</span>
                    <AdminBtn size="sm">변경</AdminBtn>
                  </div>
                </div>
              </div>

              {/* 우측 컨트롤 */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                alignItems: 'stretch', justifyContent: 'space-between',
                minWidth: 110,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} style={miniBtn(i === 0)} title="위로">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 14l6-6 6 6"/></svg>
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === slides.length - 1} style={miniBtn(i === slides.length - 1)} title="아래로">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 10l6 6 6-6"/></svg>
                  </button>
                </div>
                <button type="button" onClick={() => toggle(i)} style={{
                  padding: '6px 10px',
                  background: s.active ? '#3a2552' : '#fff',
                  color: s.active ? '#f5f1ea' : 'var(--ad-ink)',
                  border: `1px solid ${s.active ? '#3a2552' : 'var(--ad-line-strong)'}`,
                  cursor: 'pointer',
                  fontSize: 11.5,
                  fontFamily: 'var(--sans)',
                }}>{s.active ? '노출중' : '숨김'}</button>
                <button type="button" onClick={() => remove(i)} style={{
                  padding: '6px 10px',
                  background: '#fff',
                  color: '#a8322c',
                  border: '1px solid #d8b0aa',
                  cursor: 'pointer',
                  fontSize: 11.5,
                  fontFamily: 'var(--sans)',
                }}>삭제</button>
              </div>
            </div>
          ))}
          {slides.length === 0 && (
            <div style={{
              padding: '40px 20px',
              border: '1px dashed var(--ad-line-strong)',
              background: 'var(--ad-paper-2)',
              textAlign: 'center',
              color: 'var(--ad-muted)',
              fontSize: 13,
            }}>등록된 메인 배너가 없습니다. 우상단의 "배너 추가"를 눌러 시작하세요.</div>
          )}
        </div>
      </Card>

      <AddBannerModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdded}/>
    </div>
  );
}

// ─── 배너 추가 모달 ───────────────────────────────────
function AddBannerModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useStateV2({
    title: '', sub: '', cta: '자세히 보기', link: '/', start: '', end: '',
  });
  const [image, setImage] = useStateV2(null);
  const fileRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    setForm({ title: '', sub: '', cta: '자세히 보기', link: '/', start: '', end: '' });
    setImage(null);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImage({ name: f.name, size: f.size, url: URL.createObjectURL(f) });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      imageName: image?.name,
    });
  };

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
  const monoField = { ...fieldStyle, fontFamily: 'var(--mono)' };
  const labelStyle = {
    display: 'block',
    fontSize: 11, color: 'var(--ad-muted)',
    fontFamily: 'var(--mono)', letterSpacing: '0.14em',
    marginBottom: 6, textTransform: 'uppercase',
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15, 10, 28, 0.55)',
      backdropFilter: 'blur(2px)',
      zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32,
      animation: 'modalIn .18s ease',
    }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={{
        background: '#fff',
        width: 'min(720px, 100%)',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)',
        border: '1px solid var(--ad-line-strong)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '20px 26px',
          borderBottom: '1px solid var(--ad-line)',
        }}>
          <div>
            <div style={{
              fontSize: 11, color: 'var(--ad-muted)',
              fontFamily: 'var(--mono)', letterSpacing: '0.18em',
              marginBottom: 4,
            }}>NEW BANNER</div>
            <div style={{
              fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500,
            }}>배너 추가</div>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 32, height: 32,
            background: 'transparent',
            border: '1px solid var(--ad-line-strong)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} title="닫기 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: 26, overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 18px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>제목 <span style={{ color: '#a05a5a' }}>*</span></div>
              <input style={fieldStyle} value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="깊은 밤, 보랏빛 정수" required/>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>설명</div>
              <input style={fieldStyle} value={form.sub}
                onChange={(e) => setField('sub', e.target.value)}
                placeholder="비온 에센스 신상 컬렉션"/>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>대표 이미지 <span style={{ color: '#a05a5a' }}>*</span></div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }}/>
              {!image ? (
                <button type="button" onClick={() => fileRef.current?.click()} style={{
                  width: '100%', padding: '28px 16px',
                  background: 'var(--ad-paper-2)',
                  border: '1px dashed var(--ad-line-strong)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  color: 'var(--ad-muted)',
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <rect x="3" y="4" width="18" height="16"/>
                    <path d="M3 16l5-5 4 4 3-3 6 6"/>
                    <circle cx="9" cy="9" r="1.5"/>
                  </svg>
                  <span style={{ fontSize: 13 }}>히어로 이미지 업로드</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>JPG · PNG · 권장 2560×1080</span>
                </button>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: 12,
                  border: '1px solid var(--ad-line)',
                  background: 'var(--ad-paper-2)',
                }}>
                  <img src={image.url} alt="" style={{ width: 140, height: 60, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--ad-line-strong)' }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>{image.name}</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ad-muted)', marginTop: 3 }}>{(image.size / 1024).toFixed(1)} KB</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <AdminBtn size="sm" onClick={() => fileRef.current?.click()}>변경</AdminBtn>
                      <AdminBtn size="sm" variant="danger" onClick={() => { URL.revokeObjectURL(image.url); setImage(null); }}>제거</AdminBtn>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
          }}>배너 추가</button>
        </div>
      </form>
    </div>
  );
}

function MiniLabel({ children }) {
  return (
    <div style={{
      fontSize: 10.5, color: 'var(--ad-muted)',
      fontFamily: 'var(--mono)', letterSpacing: '0.12em',
      marginBottom: 4, textTransform: 'uppercase',
    }}>{children}</div>
  );
}
function MiniInput({ value, onChange, mono, placeholder }) {
  return (
    <input
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '7px 10px',
        background: '#fff',
        border: '1px solid var(--ad-line-strong)',
        fontFamily: mono ? 'var(--mono)' : 'var(--sans)',
        fontSize: 12.5,
        color: 'var(--ad-ink)',
        outline: 'none',
      }}/>
  );
}
const miniBtn = (disabled) => ({
  height: 28,
  background: '#fff',
  border: '1px solid var(--ad-line-strong)',
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.4 : 1,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--ad-ink)',
});

function SettingsBrand() {
  return (
    <>
      <Card title="브랜드 · 사이트" subtitle="BRAND" padding={22} style={{ marginBottom: 16 }}>
        <SettingRow label="브랜드 슬로건">
          <Input value="깊은 밤, 보랏빛 정수"/>
        </SettingRow>
        <SettingRow label="대표 색상" hint="쇼핑몰 헤더 / 액션 버튼 / 강조 컬러">
          <div style={{ display: 'flex', gap: 8 }}>
            {['#18102a', '#2a1a3e', '#3a2552', '#6b4d8f', '#9a7fb8', '#b89968'].map((c, i) => (
              <div key={c} style={{
                width: 36, height: 36, background: c,
                border: `2px solid ${i === 2 ? '#1a1424' : 'transparent'}`,
                cursor: 'pointer',
                position: 'relative',
              }}>
                {i === 2 && <span style={{
                  position: 'absolute', bottom: -16, left: 0,
                  fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ad-muted)',
                }}>{c}</span>}
              </div>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="로고 (다크)">
          <ImageDrop label="SVG 권장 · 최소 240×40"/>
        </SettingRow>
        <SettingRow label="로고 (라이트)">
          <ImageDrop label="SVG 권장 · 최소 240×40"/>
        </SettingRow>
        <SettingRow label="히어로 이미지">
          <ImageDrop label="2400×1400 권장 · WEBP/JPG"/>
        </SettingRow>
        <SettingRow label="기본 폰트 — 본문">
          <Select value="Pretendard (Sans)" options={['Pretendard (Sans)', 'Noto Sans KR', 'Apple SD Gothic Neo']}/>
        </SettingRow>
        <SettingRow label="기본 폰트 — 제목">
          <Select value="Noto Serif KR" options={['Noto Serif KR', 'Nanum Myeongjo', 'Spectral']}/>
        </SettingRow>
        <SettingFooter/>
      </Card>
    </>
  );
}

function SettingsShipping() {
  return (
    <div style={pageWrap}>
      <Card title="배송 설정" subtitle="SHIPPING" padding={22}>
      <SettingRow label="기본 배송사">
        <Select value="CJ대한통운" options={['CJ대한통운', '한진택배', '롯데택배', '우체국택배']}/>
      </SettingRow>
      <SettingRow label="기본 배송비">
        <div style={{ display: 'flex', gap: 8 }}>
          <Input value="3,000" mono short/>
          <span style={{ alignSelf: 'center', color: 'var(--ad-muted)', fontSize: 12 }}>원</span>
        </div>
      </SettingRow>
      <SettingRow label="무료배송 기준" hint="해당 금액 이상 주문 시 배송비 0원">
        <div style={{ display: 'flex', gap: 8 }}>
          <Input value="50,000" mono short/>
          <span style={{ alignSelf: 'center', color: 'var(--ad-muted)', fontSize: 12 }}>원 이상</span>
        </div>
      </SettingRow>
      <SettingRow label="제주 · 도서산간 추가">
        <div style={{ display: 'flex', gap: 8 }}>
          <Input value="3,000" mono short/>
          <span style={{ alignSelf: 'center', color: 'var(--ad-muted)', fontSize: 12 }}>원 추가</span>
        </div>
      </SettingRow>
      <SettingRow label="출고일 안내">
        <Textarea value="평일 오후 2시 이전 결제 건은 당일 출고됩니다. 주말 및 공휴일 결제 건은 다음 영업일에 출고됩니다."/>
      </SettingRow>
      <SettingFooter/>
    </Card>
    </div>
  );
}

function SettingsNotify() {
  const rows = [
    ['주문 접수',       '고객', true, true, false],
    ['결제 완료',       '고객 · 관리자', true, true, true],
    ['배송 시작',       '고객', true, true, false],
    ['배송 완료',       '고객', true, false, false],
    ['리뷰 요청',       '고객', true, false, false],
    ['재고 부족',       '관리자', false, false, true],
    ['직급 승급',  '고객', true, true, false],
    ['휴면 전환 예정', '고객', true, false, false],
  ];
  return (
    <Card title="알림 설정" subtitle="NOTIFICATIONS" padding={0}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--ad-paper-2)', borderBottom: '1px solid var(--ad-line)' }}>
            <th style={{ ...thStyle2, paddingLeft: 22 }}>알림 종류</th>
            <th style={thStyle2}>수신자</th>
            <th style={{ ...thStyle2, textAlign: 'center' }}>이메일</th>
            <th style={{ ...thStyle2, textAlign: 'center' }}>SMS</th>
            <th style={{ ...thStyle2, textAlign: 'center', paddingRight: 22 }}>슬랙</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--ad-line-soft)' }}>
              <td style={{ ...tdStyle2, paddingLeft: 22 }}>{r[0]}</td>
              <td style={{ ...tdStyle2, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: '0.04em' }}>{r[1]}</td>
              <td style={{ ...tdStyle2, textAlign: 'center' }}><CheckCell on={r[2]}/></td>
              <td style={{ ...tdStyle2, textAlign: 'center' }}><CheckCell on={r[3]}/></td>
              <td style={{ ...tdStyle2, textAlign: 'center', paddingRight: 22 }}><CheckCell on={r[4]}/></td>
            </tr>
          ))}
        </tbody>
      </table>
      <SettingFooter inset/>
    </Card>
  );
}
const thStyle2 = {
  padding: '12px 14px', textAlign: 'left', fontWeight: 500,
  fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
  color: 'var(--ad-muted)', fontFamily: 'var(--mono)',
};
const tdStyle2 = { padding: '14px 14px', color: 'var(--ad-ink)' };

function CheckCell({ on }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 20, height: 20,
      background: on ? '#3a2552' : '#fff',
      border: `1px solid ${on ? '#3a2552' : 'var(--ad-line-strong)'}`,
      color: '#fff',
    }}>
      {on && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12l5 5L20 7"/>
        </svg>
      )}
    </span>
  );
}

function SettingsTeam() {
  const [addOpen, setAddOpen] = useStateV2(false);
  const team = [
    { name: '김지은', email: 'jieun.kim@micoz.kr',   role: '슈퍼관리자', last: '지금 접속중', status: '활성' },
    { name: '이수영', email: 'sooyoung.lee@micoz.kr', role: '운영',     last: '5분 전',     status: '활성' },
    { name: '박재훈', email: 'jaehoon.park@micoz.kr', role: 'MD',       last: '2시간 전',   status: '활성' },
    { name: '정민아', email: 'mina.jung@micoz.kr',    role: 'CS',       last: '어제',       status: '활성' },
    { name: '서지원', email: 'jiwon.seo@micoz.kr',    role: '디자인',   last: '3일 전',     status: '활성' },
    { name: '한재석', email: 'jaeseok.han@micoz.kr',  role: '뷰어',     last: '2주 전',     status: '비활성' },
  ];
  return (
    <div style={pageWrap}>
    <Card title="관리자 · 권한" subtitle="TEAM · 6명" padding={0}
      action={<AdminBtn variant="primary" icon={AIcon.plus(13)} size="sm" onClick={() => setAddOpen(true)}>관리자 등록</AdminBtn>}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--ad-paper-2)', borderBottom: '1px solid var(--ad-line)' }}>
            <th style={{ ...thStyle2, paddingLeft: 22 }}>이름</th>
            <th style={thStyle2}>이메일</th>
            <th style={thStyle2}>상태</th>
            <th style={{ ...thStyle2, paddingRight: 22 }}></th>
          </tr>
        </thead>
        <tbody>
          {team.map((m, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--ad-line-soft)' }}>
              <td style={{ ...tdStyle2, paddingLeft: 22 }}>
                <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{m.name}</span>
              </td>
              <td style={{ ...tdStyle2, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', fontSize: 11.5 }}>{m.email}</td>
              <td style={tdStyle2}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12,
                  color: m.status === '활성' ? '#3a8a5a' : 'var(--ad-muted)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.status === '활성' ? '#3a8a5a' : '#bbb' }}/>
                  {m.status}
                </span>
              </td>
              <td style={{ ...tdStyle2, paddingRight: 22, textAlign: 'right' }}>
                <AdminBtn size="sm" icon={AIcon.edit(12)}>편집</AdminBtn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
    <AddAdminModal open={addOpen} onClose={() => setAddOpen(false)}/>
    </div>
  );
}

// ─── 관리자 등록 모달 ──────────────────────────────────
function AddAdminModal({ open, onClose }) {
  const [role, setRole] = useStateV2('운영');
  const [active, setActive] = useStateV2(true);
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
  const ROLES = ['슈퍼관리자', '운영', 'MD', 'CS', '디자인', '뷰어'];

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
          width: 'min(540px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)',
          border: '1px solid var(--ad-line-strong)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 26px',
          borderBottom: '1px solid var(--ad-line)',
        }}>
          <div>
            <div style={{
              fontSize: 11, color: 'var(--ad-muted)',
              fontFamily: 'var(--mono)', letterSpacing: '0.18em',
              marginBottom: 4,
            }}>NEW ADMIN</div>
            <div style={{
              fontFamily: 'var(--serif)', fontSize: 20,
              fontWeight: 500, color: 'var(--ad-ink)',
            }}>관리자 등록</div>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 32, height: 32,
            background: 'transparent',
            border: '1px solid var(--ad-line-strong)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ad-ink)',
          }} title="닫기 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: 26, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 18px' }}>
          <div>
            <div style={labelStyle}>아이디 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="micoz_admin" autoComplete="off" required/>
          </div>
          <div>
            <div style={labelStyle}>비밀번호 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input type="password" style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="••••••••" autoComplete="new-password" required/>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={labelStyle}>이름 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input style={fieldStyle} placeholder="홍길동" required/>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={labelStyle}>이메일 <span style={{ color: '#a05a5a' }}>*</span></div>
            <input type="email" style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="name@micoz.kr" required/>
          </div>
          <div>
            <div style={labelStyle}>전화번호</div>
            <input style={{ ...fieldStyle, fontFamily: 'var(--mono)' }} placeholder="010-0000-0000"/>
          </div>
          <div>
            <div style={labelStyle}>역할</div>
            <select style={fieldStyle} value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={labelStyle}>메모</div>
            <textarea style={{ ...fieldStyle, minHeight: 64, resize: 'vertical' }} placeholder="담당 업무, 입사일 등"/>
          </div>
          <label style={{
            gridColumn: '1 / -1',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 12.5, color: 'var(--ad-ink)',
            cursor: 'pointer',
          }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)}/>
            등록 즉시 활성화
          </label>
        </div>

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
          }}>관리자 등록</button>
        </div>
      </form>
    </div>
  );
}

function SettingsApi() {
  return (
    <Card title="API · 외부 연동" subtitle="INTEGRATIONS" padding={22}>
      <SettingRow label="API 키" hint="외부 시스템에서 MICOZ 데이터를 조회할 때 사용">
        <div style={{ display: 'flex', gap: 8 }}>
          <Input value="mcz_live_sk_8a4f29c1b6e840d1924f7b3e8c1a72e0" mono/>
          <AdminBtn>재발급</AdminBtn>
        </div>
      </SettingRow>
      <SettingRow label="웹훅 엔드포인트">
        <Input value="https://hooks.micoz.kr/v2/orders" mono/>
      </SettingRow>
      <SettingRow label="허용 IP" hint="공백 = 모든 IP 허용">
        <Input value="" placeholder="192.168.1.0/24, 10.0.0.0/8" mono/>
      </SettingRow>

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--ad-line)' }}>
        <div style={{
          fontSize: 11, color: 'var(--ad-muted)',
          fontFamily: 'var(--mono)', letterSpacing: '0.14em',
          marginBottom: 12, textTransform: 'uppercase',
        }}>연결된 서비스</div>
        {[
          { n: 'Google Analytics 4', c: 'GA-XJ8N...', on: true },
          { n: 'Slack — #orders',    c: 'T024A...XKF7', on: true },
          { n: 'Cafe24 ERP',         c: 'mcz-prd-01', on: true },
          { n: 'Mailchimp',          c: 'us8-...', on: false },
          { n: 'Klaviyo',            c: '-', on: false },
        ].map(s => (
          <div key={s.n} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '1px solid var(--ad-line-soft)',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{s.n}</div>
              <div style={{ fontSize: 11, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.06em', marginTop: 2 }}>{s.c}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11, color: s.on ? '#3a8a5a' : 'var(--ad-muted)',
                fontFamily: 'var(--mono)', letterSpacing: '0.08em',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.on ? '#3a8a5a' : '#ccc' }}/>
                {s.on ? 'CONNECTED' : 'OFF'}
              </span>
              <AdminBtn size="sm">{s.on ? '관리' : '연결'}</AdminBtn>
            </div>
          </div>
        ))}
      </div>

      <SettingFooter/>
    </Card>
  );
}

function SettingRow({ label, hint, children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '200px 1fr',
      gap: 24,
      padding: '14px 0',
      borderBottom: '1px solid var(--ad-line-soft)',
      alignItems: 'flex-start',
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ad-ink)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: 'var(--ad-muted)', marginTop: 4, lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
function SettingFooter({ inset }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-end', gap: 8,
      paddingTop: 18, marginTop: 8,
      borderTop: '1px solid var(--ad-line)',
      ...(inset ? { padding: '18px 22px' } : {}),
    }}>
      <AdminBtn>취소</AdminBtn>
      <AdminBtn variant="primary">변경 저장</AdminBtn>
    </div>
  );
}

Object.assign(window, {
  ProductsView, OrdersView, SalesView, InquiriesView,
});

// ═══════════════════════════════════════════════════════
// 1:1 문의
// ═══════════════════════════════════════════════════════
function InquiriesView() {
  const INQUIRIES = [
    {
      id: 'Q-2641', subject: '비온 에센스 100ml 재입고 일정 문의', category: '재입고',
      author: '박서영', authorId: 'M-24831', email: 'seoyoung.p@gmail.com',
      date: '2026-05-20 14:21', status: '대기', priority: '일반',
      body: '안녕하세요, 비온 에센스 100ml이 품절 표시되어 있는데 다음 입고 일정이 언제쯤일지 알 수 있을까요? 알림 신청은 해두었습니다. 감사합니다.',
    },
    {
      id: 'Q-2640', subject: '주문 O-58422 배송지 변경 가능한가요?', category: '주문 · 배송',
      author: '이하늘', authorId: 'M-24830', email: 'haneul.lee@naver.com',
      date: '2026-05-20 11:48', status: '진행중', priority: '긴급',
      body: '아직 발송 전이라 가능하다면 배송지를 서울 → 부산으로 변경 부탁드립니다.',
    },
    {
      id: 'Q-2639', subject: '환불 처리가 며칠째 안 되고 있어요', category: '환불 · 교환',
      author: '문서아', authorId: 'M-24821', email: 'seoa.moon@gmail.com',
      date: '2026-05-19 22:03', status: '진행중', priority: '긴급',
      body: '5/15에 환불 요청을 했는데 아직 처리가 안 되어 문의드립니다. 카드사 연동 문제일까요?',
    },
    {
      id: 'Q-2638', subject: '제린 세럼 사용 후 따끔거림이 있어요', category: '제품 · 사용법',
      author: '정유나', authorId: 'M-24828', email: 'yuna.j@daum.net',
      date: '2026-05-19 16:30', status: '답변완료', priority: '일반',
      body: '세럼을 바른 직후 살짝 따끔거리는 느낌이 있는데 정상 반응인지 궁금합니다.',
    },
    {
      id: 'Q-2637', subject: '회원 등급 혜택을 잘 모르겠어요', category: '회원 · 직급',
      author: '최민지', authorId: 'M-24829', email: 'minji.choi@kakao.com',
      date: '2026-05-19 10:15', status: '답변완료', priority: '일반',
      body: '마스터 등급인데 받을 수 있는 혜택을 정리해서 알려주시면 감사하겠습니다.',
    },
    {
      id: 'Q-2636', subject: '쿠폰 코드가 적용이 안 됩니다', category: '쿠폰 · 프로모션',
      author: '신예진', authorId: 'M-24823', email: 'yejin.shin@gmail.com',
      date: '2026-05-18 19:42', status: '대기', priority: '일반',
      body: '"MAY-SPECIAL-15" 쿠폰을 입력하면 사용할 수 없는 쿠폰이라고 뜹니다.',
    },
    {
      id: 'Q-2635', subject: '회원 탈퇴 후 재가입은 어떻게 하나요', category: '회원 · 직급',
      author: '백수민', authorId: 'M-24820', email: 'sumin.baek@naver.com',
      date: '2026-05-18 14:01', status: '대기', priority: '일반',
      body: '예전 계정 정보로 다시 가입이 가능한지 궁금합니다.',
    },
  ];

  const CATEGORIES = ['전체 카테고리', '주문 · 배송', '환불 · 교환', '재입고', '제품 · 사용법', '쿠폰 · 프로모션', '회원 · 직급'];

  const [status, setStatus] = useStateV2('all');
  const [cat, setCat] = useStateV2('all');
  const [query, setQuery] = useStateV2('');
  const [openId, setOpenId] = useStateV2(null);

  const filtered = INQUIRIES.filter(q => {
    if (status === 'pending'   && q.status !== '대기')     return false;
    if (status === 'progress'  && q.status !== '진행중')   return false;
    if (status === 'done'      && q.status !== '답변완료') return false;
    if (cat !== 'all' && q.category !== cat) return false;
    const s = query.trim().toLowerCase();
    if (!s) return true;
    return (
      q.id.toLowerCase().includes(s) ||
      q.subject.toLowerCase().includes(s) ||
      q.author.toLowerCase().includes(s) ||
      q.body.toLowerCase().includes(s)
    );
  });

  const STATUS_OPTS = [
    { k: 'all',      l: '전체 상태' },
    { k: 'pending',  l: '대기' },
    { k: 'progress', l: '진행중' },
    { k: 'done',     l: '답변완료' },
  ];
  const CAT_OPTS = CATEGORIES.map((c, i) => ({ k: i === 0 ? 'all' : c, l: c }));

  const openInquiry = filtered.find(q => q.id === openId) || INQUIRIES.find(q => q.id === openId);

  const counts = {
    pending:  INQUIRIES.filter(q => q.status === '대기').length,
    progress: INQUIRIES.filter(q => q.status === '진행중').length,
    done:     INQUIRIES.filter(q => q.status === '답변완료').length,
  };

  return (
    <div style={pageWrap}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Stat label="대기" value={counts.pending + '건'} sub="신규 접수 후 미답변" accent="#a85050"/>
        <Stat label="진행중" value={counts.progress + '건'} sub="담당자 배정 · 처리중" accent="#b89968"/>
        <Stat label="답변완료" value={counts.done + '건'} sub="이번 주 누적" accent="#3a2552"/>
      </div>

      <Card padding={0}>
        <FilterBar action={<AdminBtn icon={AIcon.download(13)} size="sm">CSV</AdminBtn>}>
          <AdminDropdown label="상태"     value={status} onChange={setStatus} options={STATUS_OPTS} width={170}/>
          <AdminDropdown label="카테고리" value={cat}    onChange={setCat}    options={CAT_OPTS}    width={200}/>
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
              placeholder="제목 · 회원명 · 본문 검색"
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
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ad-muted)', display: 'flex', padding: 0 }}
                title="검색어 지우기"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            )}
          </div>
        </FilterBar>

        <DataTable
          rowKey="id"
          columns={[
            { key: 'id',       label: '문의번호',  mono: true, nowrap: true, render: (v) => <span style={{ color: '#3a2552', fontWeight: 500 }}>{v}</span> },
            { key: 'subject',  label: '제목', render: (v, r) => (
              <span style={{
                fontWeight: r.status === '대기' ? 500 : 400,
                color: r.status === '대기' ? 'var(--ad-ink)' : 'var(--ad-ink)',
              }}>{v}</span>
            )},
            { key: 'category', label: '카테고리', render: (v) => (
              <span style={{
                padding: '3px 10px',
                background: '#f1edf7',
                color: '#4d3470',
                fontSize: 11.5,
                fontFamily: 'var(--sans)',
                letterSpacing: '0.02em',
                borderRadius: 6,
                whiteSpace: 'nowrap',
              }}>{v}</span>
            )},
            { key: 'author',   label: '작성자', render: (v, r) => (
              <div>
                <div style={{ fontSize: 12.5 }}>{v}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ad-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.04em', marginTop: 2 }}>{r.authorId}</div>
              </div>
            )},
            { key: 'date',     label: '접수일시', mono: true, muted: true, nowrap: true },
            { key: 'priority', label: '우선순위', render: (v) => (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11.5,
                color: v === '긴급' ? '#a8322c' : 'var(--ad-muted)',
                fontWeight: v === '긴급' ? 500 : 400,
                whiteSpace: 'nowrap',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: v === '긴급' ? '#a8322c' : '#bbb' }}/>
                {v}
              </span>
            )},
            { key: 'status',   label: '상태', render: (v) => <StatusChip status={v}/> },
          ]}
          rows={filtered}
          onRowClick={(r) => setOpenId(r.id)}
        />
        <Pagination page={1} total={filtered.length} pageSize={20} onChange={() => {}}/>
      </Card>

      <InquiryDetailModal inquiry={openInquiry} onClose={() => setOpenId(null)}/>
    </div>
  );
}

// ─── 문의 상세 / 답변 모달 ──────────────────────────────
function InquiryDetailModal({ inquiry, onClose }) {
  const [reply, setReply] = useStateV2('');
  React.useEffect(() => {
    if (!inquiry) return;
    setReply('');
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [inquiry, onClose]);
  if (!inquiry) return null;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15, 10, 28, 0.55)',
      backdropFilter: 'blur(2px)',
      zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32,
      animation: 'modalIn .18s ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff',
        width: 'min(820px, 100%)',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(15, 10, 28, 0.35)',
        border: '1px solid var(--ad-line-strong)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '20px 26px',
          borderBottom: '1px solid var(--ad-line)',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 11, color: 'var(--ad-muted)',
              fontFamily: 'var(--mono)', letterSpacing: '0.18em',
              marginBottom: 4,
            }}>INQUIRY DETAIL</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: '#3a2552', fontWeight: 500 }}>{inquiry.id}</span>
              <StatusChip status={inquiry.status}/>
              {inquiry.priority === '긴급' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '2px 10px',
                  background: '#fbece9', color: '#a8322c',
                  fontSize: 11, borderRadius: 6,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a8322c' }}/>
                  긴급
                </span>
              )}
            </div>
            <div style={{
              fontFamily: 'var(--serif)', fontSize: 19,
              marginTop: 10, fontWeight: 500,
            }}>{inquiry.subject}</div>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 32, height: 32,
            background: 'transparent',
            border: '1px solid var(--ad-line-strong)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }} title="닫기 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: 26, overflowY: 'auto', flex: 1 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 18,
            padding: '12px 0 18px',
            borderBottom: '1px solid var(--ad-line)',
            fontSize: 12,
          }}>
            <KVCol label="작성자" value={`${inquiry.author} (${inquiry.authorId})`}/>
            <KVCol label="이메일" value={inquiry.email} mono/>
            <KVCol label="카테고리" value={inquiry.category}/>
            <KVCol label="접수일시" value={inquiry.date} mono/>
          </div>

          <div style={{
            marginTop: 20,
            padding: 18,
            background: 'var(--ad-paper-2)',
            border: '1px solid var(--ad-line)',
            fontSize: 13.5,
            lineHeight: 1.7,
            color: 'var(--ad-ink)',
            whiteSpace: 'pre-wrap',
          }}>{inquiry.body}</div>

          <div style={{
            marginTop: 24,
            fontSize: 11, color: 'var(--ad-muted)',
            fontFamily: 'var(--mono)', letterSpacing: '0.14em',
            marginBottom: 10, textTransform: 'uppercase',
          }}>답변 작성</div>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="고객에게 보낼 답변을 작성하세요"
            style={{
              width: '100%', minHeight: 140,
              padding: '12px 14px',
              border: '1px solid var(--ad-line-strong)',
              background: '#fff',
              fontFamily: 'var(--sans)',
              fontSize: 13,
              color: 'var(--ad-ink)',
              lineHeight: 1.6,
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', gap: 8,
          padding: '14px 26px',
          borderTop: '1px solid var(--ad-line)',
          background: 'var(--ad-paper-2)',
        }}>
          <AdminBtn>임시저장</AdminBtn>
          <div style={{ display: 'flex', gap: 8 }}>
            <AdminBtn onClick={onClose}>닫기</AdminBtn>
            <button type="button" onClick={onClose} style={{
              padding: '8px 18px',
              background: '#3a2552', color: '#f5f1ea',
              border: '1px solid #3a2552',
              cursor: 'pointer',
              fontFamily: 'var(--sans)',
              fontSize: 12.5,
              letterSpacing: '0.02em',
            }}>답변 전송</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KVCol({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={{
        fontSize: 10, color: 'var(--ad-muted)',
        fontFamily: 'var(--mono)', letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{
        fontSize: 12.5,
        fontFamily: mono ? 'var(--mono)' : 'var(--sans)',
        color: 'var(--ad-ink)',
        wordBreak: 'break-all',
      }}>{value}</span>
    </div>
  );
}
