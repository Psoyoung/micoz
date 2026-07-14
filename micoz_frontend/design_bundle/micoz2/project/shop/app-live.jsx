// MICOZ — Live app entry (no design canvas)
// Renders the full shopping site at the home page, fully navigable.

const { useState: useSL, useCallback: useCL } = React;

function MicozApp() {
  const [page, setPage] = useSL('home');
  const [activeProduct, setActiveProduct] = useSL(null);
  const [cart, setCart] = useSL([]);
  const [toast, setToast] = useSL({ show: false, message: '' });
  const [isMobile, setIsMobile] = useSL(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onNav = useCL((p, prod) => {
    if (p === 'detail' && prod) setActiveProduct(prod);
    setPage(p);
  }, []);

  const onOpenProduct = useCL((p) => { setActiveProduct(p); setPage('detail'); }, []);

  const onAdd = useCL((product, opt, qty = 1) => {
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

  const showHeader = true;

  if (isMobile) {
    const openCart = () => setPage('cart');
    const hasOwnHeader = page === 'home' || page === 'products' || page === 'detail' || page === 'mypage' || page === 'cart' || page === 'checkout' || page === 'story';
    const showTabBar = page !== 'login' && page !== 'signup' && page !== 'checkout' && page !== 'findidpw';
    const backTo = page === 'checkout' ? 'cart' : page === 'cart' ? 'home' : page === 'signup' ? 'login' : 'home';
    const headerTitle = {
      confirm: '주문완료', login: '로그인', signup: '회원가입',
    }[page];
    return (
      <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingBottom: showTabBar ? 64 : 0 }}>
        {!hasOwnHeader && (
          <MobileHeader
            title={headerTitle}
            onBack={() => setPage(backTo)}
            cart={cart}
            onCart={openCart}
          />
        )}
        <PageFade pageKey={page + (page === 'detail' ? activeProduct?.id : '')}>
          <div>
            {page === 'home' && <MobileHome onNav={onNav} onOpenProduct={onOpenProduct} cart={cart} onOpenCart={openCart} />}
            {page === 'products' && <MobileProducts onNav={onNav} onOpenProduct={onOpenProduct} cart={cart} onOpenCart={openCart} />}
            {page === 'detail' && activeProduct && <MobileDetail product={activeProduct} onBack={() => setPage('products')} onAdd={onAdd} cart={cart} onOpenCart={openCart} />}
            {page === 'mypage' && <MobileMyPage onNav={onNav} cart={cart} onOpenCart={openCart} />}
            {page === 'cart' && <MobileCart cart={cart} onUpdateQty={updateQty} onRemove={removeItem} onCheckout={() => setPage('checkout')} onNav={onNav} onBack={() => setPage('home')} />}
            {page === 'checkout' && <MobileCheckout cart={cart} onNav={onNav} onPlaceOrder={() => { setCart([]); setPage('confirm'); }} onBack={() => setPage('cart')} />}
            {page === 'confirm' && <MobileConfirm onNav={onNav} />}
            {page === 'story' && <MobileStory onNav={onNav} onBack={() => setPage('home')} />}
            {page === 'login' && <LoginPage onNav={onNav} />}
            {page === 'signup' && <SignupPage onNav={onNav} />}
            {page === 'findidpw' && <FindIdPwPage onNav={onNav} />}
          </div>
        </PageFade>
        {showTabBar && <MobileTabBar page={page} onNav={onNav} cart={cart} />}
        <Toast show={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
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
          {page === 'findidpw' && <FindIdPwPage onNav={onNav} />}
        </div>
      </PageFade>

      <Toast show={toast.show} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MicozApp />);
