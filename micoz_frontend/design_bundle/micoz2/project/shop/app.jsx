// MICOZ — 메인 앱 (A톤 / Deep Plum 단일)
// 페이지: home, products, detail, cart, checkout, confirm, story, mypage, login, signup

const { useState: useS, useCallback } = React;

function DesktopApp() {
  const [page, setPage] = useS('home');
  const [activeProduct, setActiveProduct] = useS(null);
  const [cart, setCart] = useS([]);
  const [cartOpen, setCartOpen] = useS(false);
  const [toast, setToast] = useS({ show: false, message: '' });

  const onNav = useCallback((p, prod) => {
    if (p === 'detail' && prod) setActiveProduct(prod);
    setPage(p);
  }, []);

  const onOpenProduct = useCallback((p) => { setActiveProduct(p); setPage('detail'); }, []);

  const onAdd = useCallback((product, opt, qty = 1) => {
    const useOpt = opt || product.options[0];
    const cartId = `${product.id}-${useOpt.id}`;
    setCart(prev => {
      const exist = prev.find(i => i.cartId === cartId);
      if (exist) return prev.map(i => i.cartId === cartId ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { cartId, product, opt: useOpt, qty }];
    });
    setToast({ show: true, message: `${product.name}이(가) 장바구니에 담겼습니다.` });
  }, []);

  const updateQty = (id, q) => setCart(prev => prev.map(i => i.cartId === id ? { ...i, qty: q } : i));
  const removeItem = (id) => setCart(prev => prev.filter(i => i.cartId !== id));

  const showHeader = page !== 'login' && page !== 'signup';

  return (
    <div style={{ background: 'var(--cream)', minHeight: 1200, position: 'relative' }}>
      {showHeader && (
        <DesktopHeader
          page={page} cart={cart}
          onNav={onNav}
          onOpenCart={() => setPage('cart')}
        />
      )}
      <PageFade pageKey={page + (page === 'detail' ? activeProduct?.id : '')}>
        <div>
          {page === 'home' && <HomePage onNav={onNav} onOpenProduct={onOpenProduct} onAdd={onAdd} />}
          {page === 'products' && <ProductsPage onOpenProduct={onOpenProduct} onAdd={onAdd} />}
          {page === 'detail' && activeProduct && <DetailPage product={activeProduct} onAdd={onAdd} onNav={onNav} />}
          {page === 'cart' && <CartPage cart={cart} onUpdateQty={updateQty} onRemove={removeItem} onCheckout={() => setPage('checkout')} onNav={onNav} />}
          {page === 'checkout' && <CheckoutPage cart={cart} onNav={onNav} onPlaceOrder={() => { setCart([]); setPage('confirm'); }} />}
          {page === 'confirm' && <OrderConfirm onNav={onNav} />}
          {page === 'story' && <StoryPage onNav={onNav} />}
          {page === 'mypage' && <MyPage onNav={onNav} />}
          {page === 'login' && <LoginPage onNav={onNav} />}
          {page === 'signup' && <SignupPage onNav={onNav} />}
        </div>
      </PageFade>

      <Toast show={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}

// ─── 모바일 (간단 유지) ──────────────────────────────────
function MobileApp() {
  const [page, setPage] = useS('home');
  const [activeProduct, setActiveProduct] = useS(null);
  const [cart, setCart] = useS([]);
  const [toast, setToast] = useS({ show: false, message: '' });

  const onNav = (p, prod) => { if (p === 'detail' && prod) setActiveProduct(prod); setPage(p); };
  const onOpenProduct = (p) => { setActiveProduct(p); setPage('detail'); };
  const onAdd = (product, opt, qty = 1) => {
    const useOpt = opt || product.options[0];
    const cartId = `${product.id}-${useOpt.id}`;
    setCart(prev => {
      const exist = prev.find(i => i.cartId === cartId);
      if (exist) return prev.map(i => i.cartId === cartId ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { cartId, product, opt: useOpt, qty }];
    });
    setToast({ show: true, message: `${product.name} 담기 완료` });
  };

  return (
    <div style={{ background: 'var(--cream)', height: '100%', position: 'relative', overflowY: 'auto' }}>
      {page === 'home' && <MobileHome onNav={onNav} onOpenProduct={onOpenProduct} cart={cart} onOpenCart={() => {}} />}
      {page === 'products' && <MobileProducts onNav={onNav} onOpenProduct={onOpenProduct} cart={cart} onOpenCart={() => {}} />}
      {page === 'detail' && activeProduct && <MobileDetail product={activeProduct} onBack={() => setPage('products')} onAdd={onAdd} cart={cart} onOpenCart={() => {}} />}
      {page === 'mypage' && <MobileMyPage onNav={onNav} cart={cart} onOpenCart={() => {}} />}
      {page === 'story' && (
        <div>
          <MobileHeader cart={cart} onCart={() => {}} />
          <div style={{ height: 320, background: 'linear-gradient(170deg, #2d2347 0%, #3a2e58 50%, #4d3470 100%)', color: 'var(--cream)', padding: 24, display: 'flex', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.4em', opacity: 0.6 }}>OUR PHILOSOPHY</div>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 200, fontSize: 40, margin: '12px 0 0', lineHeight: 1.1 }}>깊은 밤이<br/>피워낸 의식</h1>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.9, fontWeight: 300 }}>
              MICOZ는 한방 전통과 모던 미니멀리즘이 만나는 자리에서 시작되었습니다.
            </p>
          </div>
          <MobileTabBar page="story" onNav={onNav} />
        </div>
      )}
      <Toast show={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}

function StaticPreview({ children }) {
  return <div style={{ width: '100%', height: '100%', overflow: 'auto', background: 'var(--cream)' }}>{children}</div>;
}

function DesktopShellStatic({ page, children }) {
  const [cart] = useS([]);
  return (
    <div>
      <DesktopHeader page={page} cart={cart} onNav={() => {}} onOpenCart={() => {}} />
      {children}
    </div>
  );
}

function MyPageReturnsView({ initialSubTab = 'list' }) {
  // Render MyPage pre-set to "취소·교환·반품" tab
  // initialSubTab passed via window flag (read by ReturnsTab)
  return <MyPage onNav={() => {}} initialTab="returns" />;
}

function App() {
  return (
    <DesignCanvas>
      <DCSection id="overview" title="MICOZ" subtitle="A톤 · Deep Plum — 럭셔리 보라톤 화장품 쇼핑몰. 풀 프로토타입 (헤더 메뉴로 모든 페이지 이동 가능)">

        <DCArtboard id="desktop-prototype" label="01 · 풀 프로토타입 (데스크탑)" width={1440} height={1024}>
          <DesktopApp />
        </DCArtboard>

      </DCSection>

      <DCSection id="auth" title="로그인 · 회원가입" subtitle="좌측 비주얼 패널 + 우측 폼의 스플릿 레이아웃">

        <DCArtboard id="screen-login" label="로그인" width={1440} height={900}>
          <StaticPreview><LoginPage onNav={() => {}} /></StaticPreview>
        </DCArtboard>

        <DCArtboard id="screen-signup" label="회원가입" width={1440} height={1100}>
          <StaticPreview><SignupPage onNav={() => {}} /></StaticPreview>
        </DCArtboard>

      </DCSection>

      <DCSection id="cart" title="장바구니" subtitle="전체 페이지 형태 — 추천 제품과 무료배송 게이지 포함">

        <DCArtboard id="screen-cart-empty" label="장바구니 · 비어있음" width={1440} height={1100}>
          <StaticPreview><DesktopShellStatic page="cart"><CartPage cart={[]} onUpdateQty={() => {}} onRemove={() => {}} onCheckout={() => {}} onNav={() => {}} /></DesktopShellStatic></StaticPreview>
        </DCArtboard>

        <DCArtboard id="screen-cart-filled" label="장바구니 · 담긴 상태" width={1440} height={1500}>
          <StaticPreview><DesktopShellStatic page="cart">
            <CartPage
              cart={[
                { cartId: 'd1', product: window.MICOZ_DATA.PRODUCTS[0], opt: window.MICOZ_DATA.PRODUCTS[0].options[1], qty: 1 },
                { cartId: 'd2', product: window.MICOZ_DATA.PRODUCTS[2], opt: window.MICOZ_DATA.PRODUCTS[2].options[0], qty: 2 },
                { cartId: 'd3', product: window.MICOZ_DATA.PRODUCTS[5], opt: window.MICOZ_DATA.PRODUCTS[5].options[0], qty: 1 },
              ]}
              onUpdateQty={() => {}} onRemove={() => {}} onCheckout={() => {}} onNav={() => {}}
            />
          </DesktopShellStatic></StaticPreview>
        </DCArtboard>

      </DCSection>

      <DCSection id="screens" title="개별 화면" subtitle="데스크탑 — 각 페이지를 독립적으로 검토">

        <DCArtboard id="screen-home" label="홈" width={1440} height={2400}>
          <StaticPreview><DesktopShellStatic page="home"><HomePage onNav={() => {}} onOpenProduct={() => {}} onAdd={() => {}} /></DesktopShellStatic></StaticPreview>
        </DCArtboard>

        <DCArtboard id="screen-products" label="제품 리스트" width={1440} height={1400}>
          <StaticPreview><DesktopShellStatic page="products"><ProductsPage onOpenProduct={() => {}} onAdd={() => {}} /></DesktopShellStatic></StaticPreview>
        </DCArtboard>

        <DCArtboard id="screen-detail" label="제품 상세" width={1440} height={2200}>
          <StaticPreview><DesktopShellStatic page="detail"><DetailPage product={window.MICOZ_DATA.PRODUCTS[0]} onAdd={() => {}} onNav={() => {}} /></DesktopShellStatic></StaticPreview>
        </DCArtboard>

        <DCArtboard id="screen-checkout" label="결제 (주문서 작성)" width={1440} height={2200}>
          <StaticPreview><DesktopShellStatic page="checkout">
            <CheckoutPage
              cart={[
                { cartId: 'demo1', product: window.MICOZ_DATA.PRODUCTS[0], opt: window.MICOZ_DATA.PRODUCTS[0].options[0], qty: 1 },
                { cartId: 'demo2', product: window.MICOZ_DATA.PRODUCTS[2], opt: window.MICOZ_DATA.PRODUCTS[2].options[0], qty: 1 },
              ]}
              onNav={() => {}} onPlaceOrder={() => {}}
            />
          </DesktopShellStatic></StaticPreview>
        </DCArtboard>

        <DCArtboard id="screen-story" label="브랜드 스토리" width={1440} height={2400}>
          <StaticPreview><DesktopShellStatic page="story"><StoryPage onNav={() => {}} /></DesktopShellStatic></StaticPreview>
        </DCArtboard>

        <DCArtboard id="screen-mypage" label="마이페이지" width={1440} height={1400}>
          <StaticPreview><DesktopShellStatic page="mypage"><MyPage onNav={() => {}} /></DesktopShellStatic></StaticPreview>
        </DCArtboard>

        <DCArtboard id="screen-returns" label="마이페이지 · 취소/교환/반품" width={1440} height={1400}>
          <StaticPreview><DesktopShellStatic page="mypage"><MyPageReturnsView /></DesktopShellStatic></StaticPreview>
        </DCArtboard>

        <DCArtboard id="screen-returns-history" label="마이페이지 · 신청 내역" width={1440} height={1100}>
          <StaticPreview><DesktopShellStatic page="mypage"><MyPageReturnsView initialSubTab="history" /></DesktopShellStatic></StaticPreview>
        </DCArtboard>

      </DCSection>

      <DCSection id="mobile" title="모바일" subtitle="iOS 환경에서 본 모습">

        <DCArtboard id="mobile-prototype" label="모바일 풀 프로토타입" width={420} height={900}>
          <IOSDevice width={402} height={874}><MobileApp /></IOSDevice>
        </DCArtboard>

        <DCArtboard id="mobile-home" label="모바일 · 홈" width={420} height={900}>
          <IOSDevice width={402} height={874}><MobileHome onNav={() => {}} onOpenProduct={() => {}} cart={[]} onOpenCart={() => {}} /></IOSDevice>
        </DCArtboard>

        <DCArtboard id="mobile-detail" label="모바일 · 상세" width={420} height={900}>
          <IOSDevice width={402} height={874}><MobileDetail product={window.MICOZ_DATA.PRODUCTS[0]} onBack={() => {}} onAdd={() => {}} cart={[]} onOpenCart={() => {}} /></IOSDevice>
        </DCArtboard>

      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
