// MICOZ — 데스크탑 화면들
// Home, Products, Detail, Cart, Story, MyPage

const { useState: useStateD, useEffect: useEffectD, useMemo: useMemoD } = React;

// ─── 헤더 / 네비게이션 ──────────────────────────────────
function DesktopHeader({ page, nav, cart, onNav, onOpenCart, dark = false }) {
  const fg = dark ? 'var(--cream)' : 'var(--ink)';
  const [searchOpen, setSearchOpen] = useStateD(false);
  const [searchQuery, setSearchQuery] = useStateD('');
  const searchRef = React.useRef(null);
  const items = [
  { id: 'home', label: '홈' },
  { id: 'products', label: '제품' },
  { id: 'story', label: '브랜드' },
  { id: 'mypage', label: '마이페이지' }];

  React.useEffect(() => {
    if (!searchOpen) return;
    setTimeout(() => searchRef.current?.focus(), 60);
    const onKey = (e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: dark ? 'var(--plum-800)' : 'var(--cream)',
      borderBottom: `1px solid ${dark ? 'rgba(245,241,234,0.10)' : 'var(--line)'}`,
      transition: 'background .35s'
    }}>
      <div style={{
        maxWidth: 1440, margin: '0 auto',
        padding: '0 56px',
        height: 80,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center'
      }}>
        <nav style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {items.map((it) =>
          <button key={it.id} onClick={() => onNav(it.id === 'products' ? 'products' : it.id)}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 400,
            letterSpacing: '0.05em', color: fg,
            padding: '4px 0',
            opacity: page === it.id || it.id === 'products' && (page === 'products' || page === 'detail') ? 1 : 0.7,
            borderBottom: page === it.id || it.id === 'products' && (page === 'products' || page === 'detail') ?
            `1px solid ${fg}` : '1px solid transparent',
            transition: 'opacity .2s'
          }}>{it.label}</button>
          )}
        </nav>

        <button onClick={() => onNav('home')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0
        }}>
          <MicozLogo size={26} color={fg} />
        </button>

        <div style={{ display: 'flex', gap: 22, alignItems: 'center', justifyContent: 'flex-end', color: fg }}>
          {/* Inline search field — slides in from the right of the search icon */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            gap: 10,
            width: searchOpen ? 180 : 18,
            overflow: 'hidden',
            transition: 'width .25s ease',
            borderBottom: searchOpen ? `1px solid ${fg}` : '1px solid transparent',
            paddingBottom: searchOpen ? 4 : 0,
          }}>
            {searchOpen && (
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                placeholder="검색어를 입력해주세요."
                style={{
                  flex: 1, minWidth: 0,
                  background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'var(--sans)', fontSize: 13,
                  color: fg, padding: 0,
                }}/>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(o => !o)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: 0, color: fg, display: 'inline-flex', alignItems: 'center',
                flexShrink: 0,
              }}
              title="검색"
            >
              {Icon.search(18, fg)}
            </button>
          </div>
          <span style={{ cursor: 'pointer' }} onClick={() => onNav('login')}>{Icon.user(18, fg)}</span>
          <button onClick={onOpenCart} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            position: 'relative', padding: 4, color: fg
          }}>
            {Icon.bag(18, fg)}
            {cart.length > 0 &&
            <span style={{
              position: 'absolute', top: -2, right: -4,
              width: 16, height: 16, borderRadius: '50%',
              background: dark ? 'var(--cream)' : 'var(--plum-700)',
              color: dark ? 'var(--plum-700)' : 'var(--cream)',
              fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--serif-en)'
            }}>{cart.reduce((s, i) => s + i.qty, 0)}</span>
            }
          </button>
          <LangSwitcher dark={dark} fg={fg} />
        </div>
      </div>
    </header>);

}

// ─── 언어 / 통화 드롭다운 ───────────────────────────────
function LangSwitcher({ dark, fg }) {
  const [open, setOpen] = useStateD(false);
  const [value, setValue] = useStateD('ko');
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const options = [
  { k: 'ko', l: '한국어' },
  { k: 'en', l: 'English' },
  { k: 'ja', l: '日本語' },
  { k: 'zh', l: '中文' }];

  const current = options.find((o) => o.k === value) || options[0];

  return (
    <div ref={ref} style={{
      position: 'relative',
      paddingLeft: 16,
      borderLeft: `1px solid ${dark ? 'rgba(245,241,234,0.18)' : 'var(--line)'}`
    }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 0, color: fg,
          fontFamily: 'var(--sans)', fontSize: 12,
          letterSpacing: '0.05em', opacity: 0.85
        }}>
        
        <span>{current.l}</span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open &&
      <div style={{
        position: 'absolute',
        top: 'calc(100% + 14px)',
        right: 0,
        minWidth: 140,
        background: 'var(--cream)',
        color: 'var(--ink)',
        border: '1px solid var(--line)',
        boxShadow: '0 10px 30px rgba(20, 12, 30, 0.10)',
        padding: '6px 0',
        zIndex: 200,
        fontFamily: 'var(--sans)'
      }}>
          {options.map((o) => {
          const selected = o.k === value;
          return (
            <button
              key={o.k}
              type="button"
              onClick={() => {setValue(o.k);setOpen(false);}}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: selected ? 'var(--plum-700)' : 'var(--ink)',
                fontWeight: selected ? 500 : 400,
                textAlign: 'left',
                letterSpacing: '0.01em'
              }}
              onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(74, 52, 112, 0.05)';}}
              onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent';}}>
              
                {o.l}
              </button>);

        })}
        </div>
      }
    </div>);

}

// ─── 푸터 ──────────────────────────────────────────────
function DesktopFooter() {
  const linkRow = ['이용약관', '개인정보처리방침', '이메일무단수집거부', 'FAQ', '1:1문의'];
  const dot =
  <span style={{
    display: 'inline-block',
    width: 1, height: 11,
    background: 'rgba(245,237,247,0.22)',
    margin: '0 14px',
    verticalAlign: 'middle'
  }} />;

  return (
    <footer style={{
      background: '#352a50',
      color: 'var(--plum-100)',
      padding: '80px 56px 48px', height: "377px"
    }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          gap: 40, flexWrap: 'wrap'
        }}>
          {/* 좌측: 로고 + 정보 */}
          <div style={{ flex: 1, minWidth: 480 }}>
            <MicozLogo size={28} color="var(--cream)" />

            {/* 링크 행 */}
            <div style={{
              marginTop: 32, marginBottom: 28,
              fontSize: 13, color: 'var(--cream)',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center',
              columnGap: 28, rowGap: 8,
              letterSpacing: '0.01em',
              opacity: 0.92
            }}>
              {linkRow.map((l, i) =>
              <a key={i} href="#" style={{
                color: 'inherit', textDecoration: 'none',
                fontFamily: 'var(--sans)'
              }}>{l}</a>
              )}
            </div>

            {/* 회사 정보 */}
            <div style={{
              fontSize: 12.5, color: 'var(--plum-200)',
              lineHeight: 2, fontFamily: 'var(--sans)',
              letterSpacing: '-0.005em',
              opacity: 0.85
            }}>
              <div>
                미코즈(주){dot}대표 : 강수아{dot}대표전화 : 1551-3301
              </div>
              <div>
                본사 : 경기 화성시 동탄기흥로 614 더퍼스트타워2차 715 (영천동){dot}
                영업본부 : 서울시 송파구 올림픽로 342 아울타워 6층
              </div>
              <div>
                사업자등록번호 : 570-87-01756{dot}통신판매업신고번호 : 제 2020-화성동탄-0970호
              </div>
              <div>
                정보책임자 E-mail : micoz123@naver.com
              </div>
            </div>

            <div style={{
              marginTop: 32, fontSize: 11.5,
              color: 'var(--plum-200)', opacity: 0.55,
              letterSpacing: '0.04em',
              fontFamily: 'var(--sans)'
            }}>
              Copyright © MICOZ. All Rights Reserved.
            </div>
          </div>

          {/* 우측: CS CENTER */}
          <div style={{ textAlign: 'right', minWidth: 200 }}>
            <div style={{
              fontFamily: 'var(--serif-en)', fontSize: 13,
              letterSpacing: '0.4em', color: 'var(--cream)',
              opacity: 0.7, marginBottom: 14
            }}>CS CENTER</div>
            <div style={{
              fontFamily: 'var(--serif-en)', fontSize: 36,
              fontWeight: 500, color: 'var(--cream)',
              letterSpacing: '-0.01em', lineHeight: 1
            }}>1551-3301</div>
            <div style={{
              marginTop: 14, fontSize: 12, color: 'var(--plum-200)',
              opacity: 0.7, lineHeight: 1.7
            }}>
              평일 10:00 — 17:00<br />
              점심 12:30 — 13:30<br />
              주말 · 공휴일 휴무
            </div>
          </div>
        </div>
      </div>
    </footer>);

}

// ─── HOME ──────────────────────────────────────────────
function HomePage({ onNav, onOpenProduct, onAdd }) {
  const { PRODUCTS, COLLECTIONS } = window.MICOZ_DATA;
  const [heroIdx, setHeroIdx] = useStateD(0);
  const [hoverTile, setHoverTile] = useStateD(-1);
  useEffectD(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % COLLECTIONS.length), 6500);
    return () => clearInterval(t);
  }, []);
  const c = COLLECTIONS[heroIdx];

  return (
    <main style={{ background: 'var(--cream)' }}>
      {/* HERO */}
      <section style={{
        position: 'relative',
        height: 'calc(100vh - 80px)',
        minHeight: 640,
        backgroundColor: '#ece2d4',
        backgroundImage: c.img ? `url(${c.img})` : c.grad,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
        transition: 'background-image 1.6s ease'
      }}>
        {/* radial soft */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 70% 40%, rgba(196, 176, 216, 0.18), transparent 60%)'
        }} />

        <div style={{
          position: 'relative', zIndex: 2, height: '100%',
          maxWidth: 1440, margin: '0 auto', padding: '0 56px',
          display: 'flex', alignItems: 'center'
        }}>
          <div style={{ color: 'var(--cream)' }}>
            <FadeIn key={`tag-${heroIdx}`} delay={50}>
              <div style={{
                fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.5em',
                opacity: 0.7, marginBottom: 28
              }}>{c.tag}</div>
            </FadeIn>
            <FadeIn key={`t-${heroIdx}`} delay={150}>
              <h1 style={{
                fontFamily: 'var(--serif)', fontWeight: 300,
                fontSize: 96, lineHeight: 1, letterSpacing: '-0.02em',
                margin: 0, marginBottom: 12
              }}>
                {c.title}<br />
                <span style={{ fontFamily: 'var(--serif-en)', fontStyle: 'italic', fontWeight: 200, opacity: 0.65 }}>{c.sub}</span>
              </h1>
            </FadeIn>
            <FadeIn key={`d-${heroIdx}`} delay={300}>
              <p style={{
                fontFamily: 'var(--serif)', fontWeight: 300,
                fontSize: 19, lineHeight: 1.7, opacity: 0.85,
                maxWidth: 460, marginTop: 32, marginBottom: 48
              }}>{c.desc}. {c.body}</p>
            </FadeIn>
            <FadeIn key={`b-${heroIdx}`} delay={420}>
              <div style={{ display: 'flex', gap: 20 }}>
                <PrimaryBtn onClick={() => onNav('products')} dark={false} style={{
                  background: 'var(--cream)', color: 'var(--plum-800)', border: 'none'
                }}>컬렉션 보기</PrimaryBtn>
                <button onClick={() => onNav('story')} style={{
                  padding: '14px 28px', background: 'transparent',
                  color: 'var(--cream)', border: '1px solid rgba(245,241,234,0.4)',
                  fontSize: 13, fontFamily: 'var(--sans)', fontWeight: 500,
                  letterSpacing: '0.18em', cursor: 'pointer', textTransform: 'uppercase'
                }}>브랜드 이야기</button>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* hero indicators */}
        <div style={{
          position: 'absolute', bottom: 36, left: 56,
          display: 'flex', gap: 8, alignItems: 'center', zIndex: 3
        }}>
          {COLLECTIONS.map((_, i) =>
          <button key={i} onClick={() => setHeroIdx(i)} style={{
            width: i === heroIdx ? 32 : 8, height: 1.5,
            background: i === heroIdx ? 'var(--cream)' : 'rgba(245,241,234,0.4)',
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'all .4s'
          }} />
          )}
          <span style={{
            marginLeft: 18, fontFamily: 'var(--serif-en)',
            fontSize: 11, color: 'var(--cream)', opacity: 0.6, letterSpacing: '0.15em'
          }}>0{heroIdx + 1} / 0{COLLECTIONS.length}</span>
        </div>

        <div style={{
          position: 'absolute', bottom: 36, right: 56, zIndex: 3,
          color: 'var(--cream)', opacity: 0.6,
          fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em'
        }}>
          SCROLL ↓
        </div>
      </section>

      {/* INTRO — removed */}

      {/* COLLECTIONS GRID */}
      <section style={{ padding: '40px 0 120px' }}>
        <div style={{ maxWidth: 1440, padding: '0 56px', margin: "0px 0px 56px", textAlign: "left" }}>
          <div style={{
            fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em',
            color: 'var(--plum-500)', marginBottom: 16
          }}>MICOZ PRODUCTS</div>
          <h2 style={{
            fontFamily: 'var(--serif)', fontWeight: 300,
            fontSize: 44, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em'
          }}>미코즈의 제품</h2>
          <p style={{
            margin: '18px 0 0', fontSize: 14.5, color: 'var(--muted)',
            fontFamily: 'var(--sans)', fontWeight: 400,
            letterSpacing: '-0.005em'
          }}>미코즈는 아름다움의 본질을 탐구하며, 피부 본연의 건강과 빛을 선사하는 제품을 만듭니다.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0
        }}>
          {[
          { title: 'Cosmetics', desc: ['건강함과 아름다운 미래를', '만나보세요.'], img: 'image/home1.jpg', placeholder: 'linear-gradient(160deg, #f6f0ea 0%, #d8cfc4 100%)' },
          { title: 'Health Supplements', desc: ['건강한 오늘,', '더 나은 내일을 위한 작은 습관.'], img: 'image/home2.jpg', placeholder: 'linear-gradient(150deg, #c98fa3 0%, #7e3552 60%, #4d1f33 100%)' },
          { title: 'Daily Essentials', desc: ['생활에 필요한', '실용적인 아이템'], img: 'image/home3.jpg', placeholder: 'linear-gradient(150deg, #c7d6e0 0%, #6e8ba4 60%, #3a546d 100%)' },
          { title: 'Beauty Devices', desc: ['스스로를 위한 특별한 시간,', '홈뷰티의 시작.'], img: 'image/home4.jpg', placeholder: 'linear-gradient(150deg, #d8a978 0%, #a06a32 55%, #6a4218 100%)' }].
          map((t, i) =>
          <button
            key={i}
            onClick={() => onNav('products')}
            onMouseEnter={() => setHoverTile(i)}
            onMouseLeave={() => setHoverTile(-1)}
            style={{
              position: 'relative',
              height: 540,
              background: t.placeholder,
              backgroundImage: t.img ? `url(${t.img})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              overflow: 'hidden',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'center',
              color: '#fff',
              transition: 'filter .4s'
            }}>

              {/* subtle dark veil for text legibility */}
              <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.28) 60%, rgba(0,0,0,0.40) 100%)',
              pointerEvents: 'none'
            }} />

              <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '0 28px',
              opacity: hoverTile === i ? 0 : 1,
              transition: 'opacity .4s'
            }}>
                  <div style={{
                fontFamily: 'var(--serif-en)', fontSize: 30,
                fontWeight: 500, letterSpacing: '0.005em',
                color: '#fff',
                textShadow: '0 1px 8px rgba(0,0,0,0.25)'
              }}>{t.title}</div>
                  <div style={{
                marginTop: 18, fontSize: 13.5, lineHeight: 1.75,
                color: 'rgba(255,255,255,0.95)',
                fontFamily: 'var(--sans)', fontWeight: 400,
                letterSpacing: '0.01em',
                textShadow: '0 1px 6px rgba(0,0,0,0.25)'
              }}>
                    {t.desc.map((d, j) => <div key={j}>{d}</div>)}
                  </div>
                </div>

              {/* hover: 바로가기 */}
              <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.35)',
              opacity: hoverTile === i ? 1 : 0,
              transition: 'opacity .4s',
              pointerEvents: 'none'
            }}>
                  <div style={{
                padding: '14px 32px',
                background: 'rgba(255,255,255,0.92)',
                color: 'var(--ink)',
                fontSize: 14,
                fontFamily: 'var(--sans)',
                fontWeight: 500,
                letterSpacing: '0.02em',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
              }}>바로가기</div>
                </div>
            </button>
          )}
        </div>
      </section>

      {/* BEST PRODUCTS */}
      <section style={{ padding: '40px 56px 120px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            marginBottom: 56
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em',
                color: 'var(--plum-500)', marginBottom: 16
              }}>BESTSELLERS</div>
              <h2 style={{
                fontFamily: 'var(--serif)', fontWeight: 300,
                fontSize: 44, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em'
              }}>가장 사랑받는</h2>
            </div>
            <ThinLink onClick={() => onNav('products')}>모든 제품 →</ThinLink>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {[
            { id: 'best1', name: '엑소이브 세럼', nameEn: 'Exoiv Serum', line: 'MICOZ EXOIV', category: '세럼',
              desc: '피부 본연의 빛을 깨우는 엑소이브 시그니처 세럼. 매일의 결을 정교하게 다듬어줍니다.',
              price: 77000, img: 'image/product1.jpg', grad: 'linear-gradient(155deg, #3a2e58 0%, #4d3470 45%, #9a7fb8 100%)', accent: '#9a7fb8',
              options: [{ id: 'o1', label: '30ml', price: 77000 }, { id: 'o2', label: '50ml', price: 118000 }] },
            { id: 'best2', name: '엑소이브 기초 3종', nameEn: 'Exoiv Skincare Set', line: 'MICOZ EXOIV', category: '세트',
              desc: '토너 · 에센스 · 크림으로 완성하는 엑소이브 라인 기초 3종 세트.',
              price: 220000, img: 'image/product2.jpg', grad: 'linear-gradient(165deg, #2d2347 0%, #3a2552 50%, #6b4d8f 100%)', accent: '#6b4d8f',
              options: [{ id: 'o1', label: '기초 3종 세트', price: 220000 }] },
            { id: 'best3', name: 'INVU 톤업 선크림', nameEn: 'INVU Tone-up Sun', line: 'MICOZ INVU', category: '선크림',
              desc: '가볍게 발리는 톤업 마무리. 일상의 자외선으로부터 피부를 지켜줍니다.',
              price: 32000, img: 'image/product3.png', grad: 'linear-gradient(170deg, #4d3470 0%, #9a7fb8 50%, #e8d8f0 100%)', accent: '#e8d8f0',
              options: [{ id: 'o1', label: '50ml', price: 32000 }] },
            { id: 'best4', name: '디스커버리 밤', nameEn: 'Discovery Balm', line: 'MICOZ STARUS', category: '밤',
              desc: '하루의 피로를 풀어주는 멀티 밤. 입술, 손끝, 어디든 부드럽게 감싸줍니다.',
              price: 55000, img: 'image/product4.jpg', grad: 'linear-gradient(150deg, #3a2e58 0%, #6b4d8f 100%)', accent: '#6b4d8f',
              options: [{ id: 'o1', label: '15g', price: 55000 }] }].
            map((p) =>
            <ProductCard key={p.id} p={p}
            onClick={() => onOpenProduct(p)}
            onAdd={onAdd} />
            )}
          </div>
        </div>
      </section>

      {/* RITUAL BANNER */}

      <DesktopFooter />
    </main>);

}

// ─── PRODUCTS LIST ──────────────────────────────────────
function ProductsPage({ onOpenProduct, onAdd }) {
  const { PRODUCTS, CATEGORIES } = window.MICOZ_DATA;
  const [cat, setCat] = useStateD('all');
  const [sort, setSort] = useStateD('featured');

  const filtered = useMemoD(() => {
    let arr = [...PRODUCTS];
    if (cat !== 'all') {
      const map = { essence: '에센스', serum: '세럼', cream: '크림', toner: '토너', mask: '마스크', cleanser: '클렌징' };
      arr = arr.filter((p) => p.category === map[cat] || cat === 'mask' && (p.category === '마스크' || p.category === '미스트' || p.category === '아이케어'));
    }
    if (sort === 'price-asc') arr.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') arr.sort((a, b) => b.price - a.price);
    if (sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    return arr;
  }, [cat, sort]);

  return (
    <main style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      {/* Page header */}
      <section style={{
        padding: '56px 56px 32px',
        background: 'linear-gradient(180deg, #f5edf7 0%, var(--cream) 100%)'
      }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--serif-en)', fontSize: 22, letterSpacing: '0.32em',
            color: 'var(--plum-700)', fontWeight: 500
          }}>SHOP · PRODUCT</div>
        </div>
      </section>

      <section style={{ padding: '40px 56px 120px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 64 }}>
          {/* Sidebar */}
          <aside>
            <div style={{
              fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em',
              color: 'var(--muted)', marginBottom: 20, paddingBottom: 16,
              borderBottom: '1px solid var(--line)'
            }}>CATEGORY</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {CATEGORIES.map((c) =>
              <li key={c.id}>
                  <button onClick={() => setCat(c.id)} style={{
                  display: 'flex', justifyContent: 'space-between', width: '100%',
                  padding: '10px 0', background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--sans)', fontSize: 14,
                  color: cat === c.id ? 'var(--plum-800)' : 'var(--muted)',
                  fontWeight: cat === c.id ? 500 : 400
                }}>
                    <span>{c.name}</span>
                    <span style={{ fontFamily: 'var(--serif-en)', fontSize: 12, opacity: 0.6 }}>({c.count})</span>
                  </button>
                </li>
              )}
            </ul>

            <div style={{
              fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em',
              color: 'var(--muted)', marginTop: 48, marginBottom: 20, paddingBottom: 16,
              borderBottom: '1px solid var(--line)'
            }}>CONCERN</div>
            {['수분', '결 정돈', '탄력', '진정', '광채'].map((t) =>
            <button key={t} style={{
              display: 'block', padding: '8px 0', background: 'transparent', border: 'none',
              cursor: 'pointer', fontSize: 13, color: 'var(--muted)', fontWeight: 300
            }}>{t}</button>
            )}
          </aside>

          <div>
            {/* Sort row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 36, paddingBottom: 20, borderBottom: '1px solid var(--line)'
            }}>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{filtered.length}개 제품</div>
              <select value={sort} onChange={(e) => setSort(e.target.value)} style={{
                background: 'transparent', border: 'none', fontFamily: 'var(--sans)',
                fontSize: 13, color: 'var(--ink)', cursor: 'pointer', letterSpacing: '0.05em',
                outline: 'none'
              }}>
                <option value="featured">추천순</option>
                <option value="price-asc">가격 낮은순</option>
                <option value="price-desc">가격 높은순</option>
                <option value="name">이름순</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, rowGap: 64 }}>
              {filtered.map((p) =>
              <ProductCard key={p.id} p={p}
              onClick={() => onOpenProduct(p)}
              onAdd={onAdd} />
              )}
            </div>
          </div>
        </div>
      </section>

      <DesktopFooter />
    </main>);

}

// ─── PRODUCT DETAIL ─────────────────────────────────────
function DetailPage({ product, onAdd, onNav }) {
  const { PRODUCTS, won } = window.MICOZ_DATA;
  const [optId, setOptId] = useStateD(product.options[0].id);
  const [qty, setQty] = useStateD(1);
  const [tab, setTab] = useStateD('detail');
  const opt = product.options.find((o) => o.id === optId);
  const related = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <main style={{ background: 'var(--cream)' }}>
      {/* Breadcrumb */}
      <div style={{
        padding: '24px 56px', maxWidth: 1440, margin: '0 auto',
        fontSize: 12, color: 'var(--muted)', letterSpacing: '0.1em'
      }}>
        <span style={{ cursor: 'pointer' }} onClick={() => onNav('home')}>HOME</span>
        <span style={{ margin: '0 10px', opacity: 0.5 }}>/</span>
        <span style={{ cursor: 'pointer' }} onClick={() => onNav('products')}>SHOP</span>
        <span style={{ margin: '0 10px', opacity: 0.5 }}>/</span>
        <span style={{ color: 'var(--ink)' }}>{product.name}</span>
      </div>

      {/* Detail hero */}
      <section style={{ padding: '20px 56px 80px' }}>
        <div style={{
          maxWidth: 1440, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 80
        }}>
          {/* left — product image */}
          <div>
            <Bottle grad={product.grad} h={720} line={product.nameEn} shape={product.category === '크림' ? 'jar' : product.category === '토너' ? 'wide' : 'tall'} />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {[0, 1, 2, 3].map((i) =>
              <div key={i} style={{
                flex: 1, aspectRatio: '1',
                background: [
                product.grad,
                'linear-gradient(155deg, #4d3470, #c4b0d8)',
                'linear-gradient(140deg, #2d2347, #6b4d8f)',
                'linear-gradient(170deg, #352a50, #9a7fb8)'][
                i],
                border: i === 0 ? '1.5px solid var(--plum-700)' : '1.5px solid transparent',
                cursor: 'pointer'
              }} />
              )}
            </div>
          </div>

          {/* right — info */}
          <div style={{ paddingTop: 32 }}>
            <div style={{
              fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em',
              color: 'var(--plum-500)', marginBottom: 16
            }}>{product.line.toUpperCase()}</div>

            <h1 style={{
              fontFamily: 'var(--serif)', fontWeight: 300,
              fontSize: 56, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em',
              lineHeight: 1.1
            }}>{product.name}</h1>
            <div style={{
              fontFamily: 'var(--serif-en)', fontStyle: 'italic',
              fontSize: 18, color: 'var(--muted)', marginTop: 6,
              fontWeight: 300, letterSpacing: '0.05em'
            }}>{product.nameEn}</div>

            <p style={{
              fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.9,
              color: 'var(--ink)', marginTop: 32, fontWeight: 300, marginBottom: 0
            }}>{product.desc}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 36 }}>
              <span style={{
                fontFamily: 'var(--serif-en)', fontSize: 28, color: 'var(--plum-800)'
              }}>{won(opt.price)}</span>
              <span style={{
                fontSize: 11, padding: '4px 10px', background: 'var(--plum-100)',
                color: 'var(--plum-700)', letterSpacing: '0.15em'
              }}>5% 적립</span>
            </div>

            <div style={{ marginTop: 36, paddingTop: 32, borderTop: '1px solid var(--line)' }}>
              <div style={{
                fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em',
                color: 'var(--muted)', marginBottom: 14
              }}>OPTION · 용량</div>
              <OptionPicker options={product.options} value={optId} onChange={setOptId} />
            </div>

            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 24 }}>
              <div>
                <div style={{
                  fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em',
                  color: 'var(--muted)', marginBottom: 12
                }}>QUANTITY</div>
                <Counter value={qty} onChange={setQty} />
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em',
                  color: 'var(--muted)', marginBottom: 12
                }}>TOTAL</div>
                <div style={{ fontFamily: 'var(--serif-en)', fontSize: 26, color: 'var(--plum-800)' }}>
                  {won(opt.price * qty)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <PrimaryBtn full size="lg" onClick={() => onAdd(product, opt, qty)}>
                장바구니 담기
              </PrimaryBtn>
              <button style={{
                width: 56, height: 56, background: 'transparent',
                border: '1px solid var(--plum-700)', cursor: 'pointer',
                color: 'var(--plum-700)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{Icon.heart(18)}</button>
            </div>

            <ul style={{
              listStyle: 'none', padding: 0, margin: '36px 0 0',
              fontSize: 13, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 10
            }}>
              <li>· 5만원 이상 구매 시 무료배송 (3-5 영업일 내 도착)</li>
              <li>· 미개봉 30일 이내 무료반품</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section style={{ padding: '0 56px 120px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'flex', gap: 48, borderBottom: '1px solid var(--line)',
            marginBottom: 48
          }}>
            {[['detail', '상세 설명'], ['ingredients', '성분'], ['howto', '사용법'], ['reviews', '리뷰 (286)']].map(([k, l]) =>
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '20px 0', background: 'transparent', border: 'none',
              borderBottom: tab === k ? '1.5px solid var(--plum-800)' : '1.5px solid transparent',
              fontFamily: 'var(--sans)', fontSize: 14, fontWeight: tab === k ? 500 : 400,
              color: tab === k ? 'var(--plum-800)' : 'var(--muted)',
              cursor: 'pointer', letterSpacing: '0.05em',
              marginBottom: -1
            }}>{l}</button>
            )}
          </div>

          {tab === 'detail' &&
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
              <div style={{
              aspectRatio: '4 / 5',
              background: product.grad
            }} />
              <div>
                <div style={{
                fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em',
                color: 'var(--plum-500)', marginBottom: 20
              }}>SIGNATURE INGREDIENT</div>
                <h3 style={{
                fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36,
                margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em', lineHeight: 1.3
              }}>28일의 발효, 보랏빛 정수</h3>
                <p style={{
                fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.9,
                color: 'var(--muted)', marginTop: 24, fontWeight: 300
              }}>
                  자연 발효된 한방 추출물이 피부의 결을 천천히 다듬어줍니다. 깊은 밤 피어나는 보랏빛 꽃잎에서 영감을 얻은 시그니처 컴파운드.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, marginTop: 32, fontSize: 13, color: 'var(--ink)' }}>
                  {['보랏빛 정수 컴파운드', '자연 발효 28일', '한방 7종 추출', '피부 자극 테스트 완료'].map((t) =>
                <li key={t} style={{
                  padding: '14px 0', borderBottom: '1px solid var(--line)',
                  display: 'flex', alignItems: 'center', gap: 14
                }}>
                      <span style={{ color: 'var(--plum-500)' }}>{Icon.check(14, 'var(--plum-500)')}</span>
                      {t}
                    </li>
                )}
                </ul>
              </div>
            </div>
          }
          {tab === 'ingredients' &&
          <div style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 2, color: 'var(--ink)', maxWidth: 800, fontWeight: 300 }}>
              정제수, 부틸렌글라이콜, 글리세린, 보라색 작약 추출물, 자색 고구마 발효 추출물, 한방 복합 추출물(인삼·감초·당귀 등 7종), 나이아신아마이드, 아데노신, 판테놀, 스쿠알란, 토코페롤, 시트르산…
            </div>
          }
          {tab === 'howto' &&
          <ol style={{ paddingLeft: 0, listStyle: 'none', counterReset: 'step', maxWidth: 720 }}>
              {[
            '클렌징 후 토너로 결을 정돈합니다.',
            '본 제품 2-3 방울을 손바닥에 덜어 부드럽게 펴 바릅니다.',
            '얼굴 안쪽에서 바깥쪽으로 천천히 흡수시킵니다.',
            '아침과 저녁, 하루 두 번 사용을 권장합니다.'].
            map((t, i) =>
            <li key={i} style={{
              padding: '24px 0', borderBottom: '1px solid var(--line)',
              display: 'grid', gridTemplateColumns: '60px 1fr', alignItems: 'baseline'
            }}>
                  <span style={{
                fontFamily: 'var(--serif-en)', fontSize: 22, color: 'var(--plum-500)'
              }}>0{i + 1}</span>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 300, lineHeight: 1.7 }}>{t}</span>
                </li>
            )}
            </ol>
          }
          {tab === 'reviews' &&
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {[
            ['김**', '결이 차분히 정돈되는 느낌이 좋아요. 향도 은은하고 끈적임 없이 깊이 흡수돼요.', 5],
            ['이**', '발림성이 정말 부드럽고, 다음날 아침 피부가 한결 매끄러워요.', 5],
            ['박**', '용기 디자인부터 향까지 럭셔리합니다. 선물용으로도 좋아요.', 4],
            ['최**', '재구매 의사 100%. 가을 겨울 건조함 잡아주는 데 최고.', 5]].
            map(([n, t, s], i) =>
            <div key={i} style={{
              padding: 28, background: 'var(--paper)', border: '1px solid var(--line)'
            }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontFamily: 'var(--serif-en)', fontSize: 13, color: 'var(--plum-700)' }}>{'★'.repeat(s)}{'☆'.repeat(5 - s)}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{n} · 2026.04.{20 + i}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.8, color: 'var(--ink)', margin: 0, fontWeight: 300 }}>{t}</p>
                </div>
            )}
            </div>
          }
        </div>
      </section>

      {/* Related */}
      <section style={{ padding: '0 56px 120px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em',
            color: 'var(--plum-500)', marginBottom: 16
          }}>YOU MAY ALSO LIKE</div>
          <h2 style={{
            fontFamily: 'var(--serif)', fontWeight: 300,
            fontSize: 36, margin: 0, marginBottom: 48, color: 'var(--plum-800)'
          }}>함께 추천하는 제품</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {related.map((p) =>
            <ProductCard key={p.id} p={p} compact
            onClick={() => onNav('detail', p)}
            onAdd={onAdd} />
            )}
          </div>
        </div>
      </section>

      <DesktopFooter />
    </main>);

}

Object.assign(window, {
  DesktopHeader, DesktopFooter, HomePage, ProductsPage, DetailPage
});