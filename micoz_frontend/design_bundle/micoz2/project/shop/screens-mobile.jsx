// MICOZ — 모바일 화면들 (iOS frame 안에서 작동)
const { useState: useStateM } = React;

// ─── 모바일 헤더 ────────────────────────────────────────
function MobileHeader({ title, onBack, onMenu, transparent, dark, cart, onCart }) {
  const fg = dark ? 'var(--cream)' : 'var(--ink)';
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      height: 52, padding: '0 16px',
      background: transparent ? 'transparent' : (dark ? 'rgba(34, 22, 56, 0.92)' : 'rgba(245, 241, 234, 0.92)'),
      backdropFilter: 'blur(20px)',
      display: 'grid', gridTemplateColumns: '40px 1fr 80px',
      alignItems: 'center',
      borderBottom: transparent ? 'none' : `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'var(--line)'}`,
    }}>
      {onBack ? (
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: fg, cursor: 'pointer', padding: 6, marginLeft: -6 }}>
          {Icon.back(20, fg)}
        </button>
      ) : onMenu ? (
        <button onClick={onMenu} style={{ background: 'transparent', border: 'none', color: fg, cursor: 'pointer', padding: 6, marginLeft: -6 }}>
          {Icon.menu(20, fg)}
        </button>
      ) : <div/>}
      <div style={{ textAlign: 'center', color: fg }}>
        {typeof title === 'string'
          ? <MicozLogo size={16} color={fg} />
          : title}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
        <span style={{ color: fg }}>{Icon.search(18, fg)}</span>
        <button onClick={onCart} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, position: 'relative', color: fg }}>
          {Icon.bag(18, fg)}
          {cart && cart.length > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -6,
              width: 14, height: 14, borderRadius: '50%',
              background: 'var(--plum-700)', color: 'var(--cream)',
              fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--serif-en)',
            }}>{cart.reduce((s, i) => s + i.qty, 0)}</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── 모바일 탭바 ────────────────────────────────────────
function MobileTabBar({ page, onNav, cart = [] }) {
  const tabs = [
    ['home', '홈', Icon.search],
    ['products', '제품', Icon.bag],
    ['mypage', '마이', Icon.user],
    ['cart', '장바구니', Icon.heart],
  ];
  return (
    <div style={{
      position: 'sticky', bottom: 0,
      background: 'rgba(245, 241, 234, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--line)',
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      padding: '8px 0 24px',
    }}>
      {tabs.map(([id, l, ic]) => {
        const active = page === id || (id === 'products' && page === 'detail');
        const isCart = id === 'cart';
        const count = isCart ? cart.reduce((s, i) => s + i.qty, 0) : 0;
        return (
          <button key={id} onClick={() => onNav(id)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: 6, color: active ? 'var(--plum-800)' : 'var(--muted)',
            position: 'relative',
          }}>
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              {ic(20, active ? 'var(--plum-800)' : 'var(--muted)')}
              {isCart && count > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -8,
                  minWidth: 16, height: 16, borderRadius: '50%',
                  background: 'var(--plum-700)', color: 'var(--cream)',
                  fontSize: 9, fontFamily: 'var(--serif-en)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                }}>{count}</span>
              )}
            </span>
            <span style={{ fontSize: 10, letterSpacing: '0.05em' }}>{l}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── 모바일 홈 ──────────────────────────────────────────
function MobileHome({ onNav, onOpenProduct, cart, onOpenCart }) {
  const { PRODUCTS, COLLECTIONS } = window.MICOZ_DATA;
  const c = COLLECTIONS[0];
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <MobileHeader cart={cart} onCart={onOpenCart} dark transparent />
      {/* Hero */}
      <section style={{
        marginTop: -52, paddingTop: 52,
        height: 560, background: c.grad, position: 'relative', overflow: 'hidden',
        color: 'var(--cream)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 70% 30%, rgba(196, 176, 216, 0.18), transparent 60%)',
        }}/>
        <div style={{ position: 'relative', padding: '32px 24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em',
              opacity: 0.7,
            }}>NEW · 2026</div>
            <h1 style={{
              fontFamily: 'var(--serif)', fontWeight: 300,
              fontSize: 56, margin: '20px 0 0', lineHeight: 1, letterSpacing: '-0.02em',
            }}>{c.title}<br/><em style={{ fontFamily: 'var(--serif-en)', fontWeight: 200, opacity: 0.7 }}>{c.sub}</em></h1>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.7,
              opacity: 0.85, marginTop: 18, fontWeight: 300, maxWidth: 240,
            }}>{c.desc}</p>
          </div>
          <div style={{ position: 'absolute', right: 0, bottom: 0, width: 220, height: 360 }}>
            <Bottle grad={c.grad} h={360} line={c.sub} />
          </div>
          <div>
            <ThinLink color="var(--cream)">컬렉션 보기 →</ThinLink>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em',
          color: 'var(--plum-500)', marginBottom: 20,
        }}>PHILOSOPHY</div>
        <h2 style={{
          fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 28,
          margin: 0, lineHeight: 1.4, color: 'var(--plum-800)',
        }}>가장 깊은 보랏빛 안에<br/>가장 조용한 회복.</h2>
      </section>

      {/* Collections */}
      <section style={{ padding: '0 24px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 8 }}>SIGNATURE</div>
            <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 26, margin: 0, color: 'var(--plum-800)' }}>세 가지 컬렉션</h3>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {COLLECTIONS.map((col, i) => (
            <div key={col.id} onClick={() => onNav('products')} style={{
              height: 180, background: col.grad, position: 'relative', cursor: 'pointer',
              padding: 24, color: 'var(--cream)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, transparent 50%, rgba(20,12,30,0.4))' }}/>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', opacity: 0.7 }}>0{i+1}</span>
                <span style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', opacity: 0.7 }}>{col.sub}</span>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 300 }}>{col.title}</div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{col.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Best */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 8 }}>BESTSELLERS</div>
          <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 26, margin: 0, color: 'var(--plum-800)' }}>가장 사랑받는</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, rowGap: 32 }}>
          {PRODUCTS.slice(0, 4).map(p => (
            <ProductCard key={p.id} p={p} compact onClick={() => onOpenProduct(p)} />
          ))}
        </div>
      </section>

      <MobileTabBar page="home" onNav={onNav} />
    </div>
  );
}

// ─── 모바일 제품 리스트 ──────────────────────────────────
function MobileProducts({ onNav, onOpenProduct, cart, onOpenCart }) {
  const { PRODUCTS, CATEGORIES } = window.MICOZ_DATA;
  const [cat, setCat] = useStateM('all');
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%' }}>
      <MobileHeader cart={cart} onCart={onOpenCart} />
      <section style={{ padding: '24px 24px 0' }}>
        <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 8 }}>SHOP · ALL</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.02em' }}>제품 전체</h1>
      </section>
      <div style={{ overflowX: 'auto', padding: '24px 24px 12px', display: 'flex', gap: 8, scrollbarWidth: 'none' }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{
            padding: '8px 16px', whiteSpace: 'nowrap',
            background: cat === c.id ? 'var(--plum-700)' : 'transparent',
            color: cat === c.id ? 'var(--cream)' : 'var(--ink)',
            border: `1px solid ${cat === c.id ? 'var(--plum-700)' : 'var(--line-strong)'}`,
            fontSize: 12, cursor: 'pointer', letterSpacing: '0.05em',
          }}>{c.name}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, rowGap: 32, padding: '16px 24px 100px' }}>
        {PRODUCTS.map(p => (
          <ProductCard key={p.id} p={p} compact onClick={() => onOpenProduct(p)} />
        ))}
      </div>
      <MobileTabBar page="products" onNav={onNav} />
    </div>
  );
}

// ─── 모바일 상세 ────────────────────────────────────────
function MobileDetail({ product, onBack, onAdd, cart, onOpenCart }) {
  const { won } = window.MICOZ_DATA;
  const [optId, setOptId] = useStateM(product.options[0].id);
  const [qty, setQty] = useStateM(1);
  const opt = product.options.find(o => o.id === optId);
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%', paddingBottom: 100 }}>
      <MobileHeader onBack={onBack} cart={cart} onCart={onOpenCart} dark transparent />
      <div style={{
        marginTop: -52, paddingTop: 52,
        background: product.grad, height: 460,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        <Bottle grad={product.grad} h={420} line={product.nameEn} shape={product.category === '크림' ? 'jar' : 'tall'} />
      </div>
      <div style={{ padding: '32px 24px' }}>
        <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 12 }}>{product.line.toUpperCase()}</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em' }}>{product.name}</h1>
        <div style={{ fontFamily: 'var(--serif-en)', fontStyle: 'italic', fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{product.nameEn}</div>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.8, color: 'var(--ink)', marginTop: 20, fontWeight: 300 }}>{product.desc}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
          <span style={{ fontFamily: 'var(--serif-en)', fontSize: 22, color: 'var(--plum-800)' }}>{won(opt.price)}</span>
          <span style={{ fontSize: 10, padding: '3px 8px', background: 'var(--plum-100)', color: 'var(--plum-700)', letterSpacing: '0.15em' }}>5% 적립</span>
        </div>

        <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.3em', color: 'var(--muted)', marginBottom: 12 }}>OPTION</div>
          <OptionPicker options={product.options} value={optId} onChange={setOptId} />
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Counter value={qty} onChange={setQty} />
          <span style={{ fontFamily: 'var(--serif-en)', fontSize: 22, color: 'var(--plum-800)' }}>{won(opt.price * qty)}</span>
        </div>
      </div>

      {/* sticky add to cart */}
      <div style={{
        position: 'sticky', bottom: 0,
        padding: '16px 24px 32px',
        background: 'var(--cream)',
        borderTop: '1px solid var(--line)',
        display: 'flex', gap: 10,
      }}>
        <button style={{
          width: 52, height: 52, background: 'transparent',
          border: '1px solid var(--plum-700)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--plum-700)',
        }}>{Icon.heart(16)}</button>
        <PrimaryBtn full size="lg" onClick={() => onAdd(product, opt, qty)}>장바구니 담기</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── 모바일 마이페이지 (간략) ────────────────────────────
function MobileMyPage({ onNav, cart, onOpenCart }) {
  const { won } = window.MICOZ_DATA;
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%', paddingBottom: 80 }}>
      <MobileHeader cart={cart} onCart={onOpenCart} />
      <section style={{ padding: '24px 24px 16px' }}>
        <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 8 }}>MY MICOZ</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 32, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em' }}>지우 님,<br/>안녕하세요.</h1>
      </section>
      <section style={{ padding: '0 24px' }}>
        <div style={{ background: 'var(--plum-900)', color: 'var(--cream)', padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.3em', opacity: 0.6 }}>POINT</span>
            <span style={{ fontSize: 11, opacity: 0.5 }}>VIP</span>
          </div>
          <div style={{ fontFamily: 'var(--serif-en)', fontSize: 28, marginTop: 6 }}>{won(28400).replace('₩ ', '')}<span style={{ fontSize: 12, opacity: 0.6, marginLeft: 4 }}>P</span></div>
          <div style={{ marginTop: 16, height: 2, background: 'rgba(245,241,234,0.18)' }}>
            <div style={{ width: '62%', height: '100%', background: 'var(--plum-200)' }}/>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
          {[['주문', 12], ['찜', 8], ['리뷰', 4], ['쿠폰', 3]].map(([l, c]) => (
            <div key={l} style={{ background: 'var(--paper)', border: '1px solid var(--line)', padding: '14px 8px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--serif-en)', fontSize: 22, color: 'var(--plum-800)' }}>{c}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {['주문 내역', '배송 조회', '찜한 제품', '내 리뷰', '배송지 관리', '회원 정보', '1:1 문의', '로그아웃'].map(l => (
            <li key={l} style={{
              padding: '18px 0', borderBottom: '1px solid var(--line)',
              fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{l}</span>
              <span style={{ color: 'var(--muted)' }}>{Icon.arrow(14)}</span>
            </li>
          ))}
        </ul>
      </section>
      <MobileTabBar page="mypage" onNav={onNav} />
    </div>
  );
}

Object.assign(window, {
  MobileHeader, MobileTabBar, MobileHome, MobileProducts, MobileDetail, MobileMyPage,
  MobileCart, MobileCheckout, MobileConfirm, MobileStory,
});

// ═══════════════════════════════════════════════════════
// 모바일 · 장바구니
// ═══════════════════════════════════════════════════════
function MobileCart({ cart, onUpdateQty, onRemove, onCheckout, onNav, onBack }) {
  const { won } = window.MICOZ_DATA;
  const sub = cart.reduce((s, i) => s + i.opt.price * i.qty, 0);
  const ship = sub === 0 ? 0 : sub >= 50000 ? 0 : 3000;
  const total = sub + ship;
  const earn = Math.floor(sub * 0.05);

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%', paddingBottom: cart.length === 0 ? 80 : 180 }}>
      <MobileHeader title="장바구니" onBack={onBack} cart={cart} onCart={() => {}} />

      {cart.length === 0 ? (
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ marginBottom: 24, opacity: 0.4 }}>{Icon.bag(36, 'var(--muted)')}</div>
          <h3 style={{
            fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 22,
            margin: 0, color: 'var(--plum-800)',
          }}>장바구니가 비어 있어요.</h3>
          <button onClick={() => onNav('products')} style={{
            marginTop: 28,
            padding: '14px 28px',
            background: 'var(--plum-700)', color: 'var(--cream)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 13,
            letterSpacing: '0.04em',
          }}>제품 둘러보기 →</button>
        </div>
      ) : (
        <>
          {/* select all bar */}
          <div style={{
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--line)',
            background: '#ffffff',
            fontSize: 13, color: 'var(--muted)',
          }}>
            <span>총 {cart.length}개 제품</span>
            <span style={{ fontFamily: 'var(--serif-en)', color: 'var(--plum-700)' }}>전체선택</span>
          </div>

          {/* item list */}
          <div>
            {cart.map((it) => (
              <div key={it.cartId} style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--line)',
                background: '#ffffff',
                display: 'flex', gap: 12,
              }}>
                <div style={{
                  width: 76, height: 96, flexShrink: 0,
                  background: it.product.grad,
                }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--serif)', fontSize: 15,
                        color: 'var(--plum-800)', fontWeight: 500,
                        lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>{it.product.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{it.opt.label}</div>
                    </div>
                    <button onClick={() => onRemove(it.cartId)} style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      padding: 4, color: 'var(--muted)', flexShrink: 0,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 6l12 12M18 6L6 18"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{
                    marginTop: 12,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    {/* qty */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      border: '1px solid var(--line-strong)',
                    }}>
                      <button onClick={() => onUpdateQty(it.cartId, Math.max(1, it.qty - 1))}
                        style={qtyBtnM}>−</button>
                      <span style={qtyValM}>{it.qty}</span>
                      <button onClick={() => onUpdateQty(it.cartId, it.qty + 1)}
                        style={qtyBtnM}>+</button>
                    </div>
                    <div style={{ fontFamily: 'var(--serif-en)', fontSize: 15, color: 'var(--plum-800)' }}>
                      {won(it.opt.price * it.qty)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* summary */}
          <div style={{ padding: '20px 20px 24px', background: '#ffffff', marginTop: 8 }}>
            {sub > 0 && sub < 50000 && (
              <div style={{
                padding: '12px 14px',
                background: 'var(--plum-50)',
                fontSize: 12, color: 'var(--plum-700)',
                marginBottom: 16, lineHeight: 1.5,
              }}>
                {won(50000 - sub)} 더 담으면 <strong>무료 배송</strong>
                <div style={{ marginTop: 8, height: 3, background: 'rgba(58, 37, 82, 0.12)', overflow: 'hidden' }}>
                  <div style={{ width: `${(sub / 50000) * 100}%`, height: '100%', background: 'var(--plum-700)' }}/>
                </div>
              </div>
            )}
            {[
              ['소계', won(sub)],
              ['배송비', ship === 0 ? '무료' : won(ship)],
              ['적립 예정', '+ ' + won(earn), 'var(--plum-500)'],
            ].map(([k, v, color]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', fontSize: 13.5,
              }}>
                <span style={{ color: 'var(--muted)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--serif-en)', color: color || 'var(--ink)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* sticky checkout */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--cream)',
            borderTop: '1px solid var(--line)',
            padding: '14px 20px 28px',
            zIndex: 30,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>최종 결제</span>
              <span style={{ fontFamily: 'var(--serif-en)', fontSize: 22, color: 'var(--plum-800)' }}>{won(total)}</span>
            </div>
            <button onClick={onCheckout} style={{
              width: '100%', padding: '16px 0',
              background: 'var(--plum-800)', color: 'var(--cream)',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
              letterSpacing: '0.05em',
            }}>{cart.length}개 상품 결제하기</button>
          </div>
        </>
      )}
    </div>
  );
}

const qtyBtnM = {
  width: 30, height: 30, background: 'transparent',
  border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--ink)',
};
const qtyValM = {
  minWidth: 30, textAlign: 'center', fontFamily: 'var(--serif-en)',
  fontSize: 13, padding: '0 4px',
};

// ═══════════════════════════════════════════════════════
// 모바일 · 결제 / 주문서
// ═══════════════════════════════════════════════════════
function MobileCheckout({ cart, onNav, onPlaceOrder, onBack }) {
  const { won } = window.MICOZ_DATA;
  const [pay, setPay] = useStateM('credit');
  const [agree, setAgree] = useStateM(false);
  const sub = cart.reduce((s, i) => s + i.opt.price * i.qty, 0);
  const ship = sub === 0 ? 0 : sub >= 50000 ? 0 : 3000;
  const total = sub + ship;

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%', paddingBottom: 180 }}>
      <MobileHeader title="주문서" onBack={onBack} cart={cart} onCart={() => onNav('cart')} />

      {/* 배송지 */}
      <MSection title="배송지 정보">
        <div style={{
          padding: 16, background: '#ffffff',
          border: '1.5px solid var(--plum-700)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>김미코 · 010-1234-5678</span>
            <span style={{
              padding: '3px 10px', background: 'var(--plum-700)', color: 'var(--cream)',
              fontSize: 10, letterSpacing: '0.18em',
            }}>기본</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            서울특별시 성동구 성수이로 89,<br/>
            미코즈빌딩 4층 (성수동2가)
          </div>
          <button style={{
            marginTop: 12, padding: '8px 14px',
            background: 'transparent', border: '1px solid var(--line-strong)',
            cursor: 'pointer', fontSize: 12, color: 'var(--ink)',
          }}>배송지 변경</button>
        </div>
        <select defaultValue="default" style={{
          width: '100%', marginTop: 10,
          padding: '12px 14px',
          background: '#ffffff',
          border: '1px solid var(--line-strong)',
          fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)',
          outline: 'none', borderRadius: 0,
        }}>
          <option value="default">배송 시 요청사항을 선택하세요</option>
          <option value="absent">부재 시 경비실 보관</option>
          <option value="door">문 앞에 놓아주세요</option>
          <option value="direct">직접 받겠습니다</option>
        </select>
      </MSection>

      {/* 주문 상품 */}
      <MSection title={`주문 상품 (${cart.length})`}>
        <div style={{ background: '#ffffff' }}>
          {cart.map((it, i) => (
            <div key={it.cartId} style={{
              display: 'flex', gap: 12, padding: '14px 16px',
              borderBottom: i < cart.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <div style={{ width: 60, height: 74, background: it.product.grad, flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--plum-800)',
                  fontWeight: 500, lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>{it.product.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
                  {it.opt.label} · {it.qty}개
                </div>
                <div style={{ marginTop: 6, fontFamily: 'var(--serif-en)', fontSize: 14, color: 'var(--ink)' }}>
                  {won(it.opt.price * it.qty)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </MSection>

      {/* 결제 수단 */}
      <MSection title="결제 수단">
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
        }}>
          {[
            ['credit', '신용카드'],
            ['kakao', '카카오페이'],
            ['naver', '네이버페이'],
            ['transfer', '계좌이체'],
          ].map(([k, l]) => {
            const sel = pay === k;
            return (
              <button key={k} onClick={() => setPay(k)} style={{
                padding: '14px 8px',
                background: sel ? 'var(--plum-700)' : '#ffffff',
                color: sel ? 'var(--cream)' : 'var(--ink)',
                border: `1px solid ${sel ? 'var(--plum-700)' : 'var(--line-strong)'}`,
                cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
              }}>{l}</button>
            );
          })}
        </div>
      </MSection>

      {/* 결제 금액 */}
      <MSection title="결제 금액">
        <div style={{ background: '#ffffff', padding: '16px 18px' }}>
          {[
            ['상품 금액', won(sub)],
            ['배송비', ship === 0 ? '무료' : won(ship)],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 0', fontSize: 13.5,
            }}>
              <span style={{ color: 'var(--muted)' }}>{k}</span>
              <span style={{ fontFamily: 'var(--serif-en)' }}>{v}</span>
            </div>
          ))}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginTop: 12, paddingTop: 12,
            borderTop: '1px solid var(--line)',
          }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>최종 결제</span>
            <span style={{ fontFamily: 'var(--serif-en)', fontSize: 22, color: 'var(--plum-800)' }}>{won(total)}</span>
          </div>
        </div>
      </MSection>

      {/* 약관 동의 */}
      <div style={{ padding: '16px 20px' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, color: 'var(--ink)', cursor: 'pointer',
        }}>
          <span style={{
            width: 18, height: 18,
            background: agree ? 'var(--plum-700)' : 'transparent',
            border: `1.5px solid ${agree ? 'var(--plum-700)' : 'var(--line-strong)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} onClick={() => setAgree(!agree)}>
            {agree && Icon.check(12, 'var(--cream)')}
          </span>
          개인정보 수집 · 이용 및 결제 진행에 동의합니다.
        </label>
      </div>

      {/* sticky pay button */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--cream)',
        borderTop: '1px solid var(--line)',
        padding: '14px 20px 28px',
        zIndex: 30,
      }}>
        <button onClick={agree ? onPlaceOrder : undefined} style={{
          width: '100%', padding: '16px 0',
          background: agree ? 'var(--plum-800)' : 'var(--line-strong)',
          color: 'var(--cream)',
          border: 'none', cursor: agree ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--sans)', fontSize: 14.5, fontWeight: 500,
          letterSpacing: '0.04em',
        }}>{won(total)} 결제하기</button>
      </div>
    </div>
  );
}

function MSection({ title, children }) {
  return (
    <div style={{ padding: '12px 20px 4px' }}>
      <div style={{
        fontFamily: 'var(--serif-en)', fontSize: 11,
        letterSpacing: '0.3em', color: 'var(--muted)',
        marginBottom: 10, textTransform: 'uppercase',
      }}>{title}</div>
      <div style={{ marginBottom: 16 }}>{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 모바일 · 주문 완료
// ═══════════════════════════════════════════════════════
function MobileConfirm({ onNav }) {
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%', padding: '60px 24px 80px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--plum-700)',
          color: 'var(--cream)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12l5 5L20 7"/>
          </svg>
        </div>
        <div style={{
          fontFamily: 'var(--serif-en)', fontSize: 11,
          letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 12,
        }}>ORDER CONFIRMED</div>
        <h1 style={{
          fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 28,
          margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em',
        }}>주문이 접수되었습니다.</h1>
        <p style={{
          marginTop: 18, fontSize: 13.5, color: 'var(--muted)',
          lineHeight: 1.8,
        }}>
          주문번호 <span style={{ fontFamily: 'var(--serif-en)', color: 'var(--plum-700)' }}>MZ-26050700428</span><br/>
          정성껏 준비해 보내드릴게요.
        </p>
      </div>
      <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => onNav('mypage')} style={{
          padding: '14px 0', background: 'var(--plum-800)', color: 'var(--cream)',
          border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
        }}>주문 내역 보기</button>
        <button onClick={() => onNav('home')} style={{
          padding: '14px 0', background: 'transparent', color: 'var(--ink)',
          border: '1px solid var(--line-strong)', cursor: 'pointer', fontSize: 13.5,
        }}>홈으로 돌아가기</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 모바일 · 브랜드 스토리 (간략)
// ═══════════════════════════════════════════════════════
function MobileStory({ onNav, onBack }) {
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%', paddingBottom: 80 }}>
      <MobileHeader title="브랜드" onBack={onBack} cart={[]} onCart={() => onNav('cart')} />

      {/* About */}
      <section style={{ padding: '32px 24px 40px' }}>
        <image-slot
          id="m-about-photo"
          placeholder="대표 이미지"
          style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', marginBottom: 28 }}
        ></image-slot>
        <div style={{
          fontFamily: 'var(--serif-en)', fontSize: 11,
          letterSpacing: '0.32em', color: 'var(--plum-500)',
          marginBottom: 14, fontStyle: 'italic',
        }}>About micoz</div>
        <h2 style={{
          fontFamily: 'var(--serif)', fontWeight: 400,
          fontSize: 22, margin: 0, color: 'var(--plum-800)',
          letterSpacing: '-0.005em', lineHeight: 1.45,
        }}>
          미코즈(주)의 기술력으로<br/>건강하고 아름다운 미래를 만들어 갑니다.
        </h2>
        <p style={{
          marginTop: 18, fontFamily: 'var(--serif)',
          fontSize: 13.5, lineHeight: 1.95, color: 'var(--muted)',
          fontWeight: 300,
        }}>
          미코즈㈜는 헬스와 뷰티 디바이스, 화장품 전문회사로 인간의 노화에서는 세포와 피부의 재생을 효과적으로 해결해 최고 아름답게 만들어드리는 제조, 유통, 콘텐츠가 합쳐진 플랫폼 기반의 글로벌 회사입니다.
        </p>
      </section>

      {/* CEO greeting */}
      <section style={{
        background: '#352a50', color: 'var(--cream)',
        padding: '48px 24px',
      }}>
        <h2 style={{
          fontFamily: 'var(--serif-en)', fontWeight: 500,
          fontSize: 28, margin: 0, letterSpacing: '-0.01em',
        }}>More Healthy Life</h2>
        <p style={{
          marginTop: 22, fontFamily: 'var(--serif)',
          fontSize: 13, lineHeight: 1.95, color: 'rgba(245,237,247,0.78)',
          fontWeight: 300,
        }}>
          안녕하세요 미코즈㈜ 김정희회장입니다.<br/>
          항상 미코즈에 깊은 관심과 사랑으로 성원해 주시는 분들께 진심으로 감사드립니다.
          저희는 성장을 발판으로 책임감있는 경영과 윤리적인 경영을 실천하기 위해 항상 일정 서고 있으며,
          뷰티 업계 26년의 경력과 경험으로 모두가 추구하는 가치를 이루어가기 위해 노력하고 있습니다.
        </p>
        <div style={{
          marginTop: 24, display: 'flex', alignItems: 'baseline', gap: 12,
          fontFamily: 'var(--serif)', fontSize: 12, color: 'var(--plum-200)',
        }}>
          <span>미코즈㈜ 회장</span>
          <span style={{
            fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 300,
            color: 'var(--cream)', fontStyle: 'italic',
          }}>김정희</span>
        </div>
      </section>

      {/* Vision band */}
      <section style={{
        padding: '40px 24px', textAlign: 'center',
        background: 'linear-gradient(180deg, #f8f3ec 0%, #ede5d8 50%, #f5edf7 100%)',
      }}>
        <h2 style={{
          fontFamily: 'var(--serif-en)', fontWeight: 500,
          fontSize: 22, margin: 0, color: 'var(--plum-800)',
        }}>Company Philosophy<br/>&amp; Vision</h2>
        <p style={{
          marginTop: 18, fontFamily: 'var(--serif)', fontSize: 13.5,
          lineHeight: 2, color: 'var(--muted)', fontWeight: 300,
        }}>
          미코즈는 성장을 발판으로 책임감있는 경영과 윤리적인 경영을 실천하기위해 경영이념을 세기며 실천해 나아가고있습니다.
        </p>
      </section>

      {/* Trusted / Flexible / Fostering */}
      {[
        { t: ['Trusted Company', 'For Everyone'], d: ['도덕성과 정직함을 바탕으로 연구개발을 진행해', '신뢰받는 기업으로 도약합니다.'], g: 'linear-gradient(155deg, #e8d8f0 0%, #c4b0d8 40%, #9a7fb8 80%, #6b4d8f 100%)' },
        { t: ['Flexible Development', 'Workforce'], d: ['인재들의 잠재력을 이끌어내어 성장을 극대화하여', '사회발전에 기여합니다.'], g: 'linear-gradient(165deg, #f5f1ea 0%, #e8dfd2 35%, #d0c3b0 70%, #b09c80 100%)' },
        { t: ['Fostering', 'Workforce'], d: ['유연한 연구개발을 진행하여', '새로운 가치를 창출하고 시도합니다.'], g: 'linear-gradient(155deg, #f5e6c0 0%, #e8c878 35%, #c89a3c 70%, #8a6420 100%)' },
      ].map((s, i) => (
        <section key={i}>
          <div style={{ width: '100%', aspectRatio: '4 / 3', background: s.g }}/>
          <div style={{ padding: '36px 24px 8px', textAlign: 'center' }}>
            <h3 style={{
              fontFamily: 'var(--serif-en)', fontWeight: 500,
              fontSize: 24, margin: 0, color: 'var(--plum-800)',
              letterSpacing: '-0.005em', lineHeight: 1.2,
            }}>{s.t[0]}<br/>{s.t[1]}</h3>
            <p style={{
              marginTop: 18, fontFamily: 'var(--serif)', fontSize: 13.5,
              lineHeight: 1.95, color: 'var(--muted)', fontWeight: 300,
            }}>{s.d[0]}<br/>{s.d[1]}</p>
          </div>
        </section>
      ))}
    </div>
  );
}
