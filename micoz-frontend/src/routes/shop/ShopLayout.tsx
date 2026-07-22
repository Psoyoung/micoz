import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import DesktopHeader from '../../components/shop/DesktopHeader'
import DesktopFooter from '../../components/shop/DesktopFooter'
import MobileHeader from '../../components/shop/MobileHeader'
import MobileTabBar from '../../components/shop/MobileTabBar'
import CartDrawer from '../../components/shop/CartDrawer'
import { CartProvider, useCart } from '../../contexts/CartContext'
import { ToastProvider } from '../../contexts/ToastContext'
import { useIsMobile } from '../../lib/useIsMobile'

// 쇼핑몰 레이아웃 — Cart/Toast Provider + 뷰포트별 크롬(데스크탑 헤더/푸터 ↔ 모바일 헤더/탭바) + CartDrawer.
// 모바일에서 home/products/detail 은 화면이 자체 크롬을 가지므로 레이아웃은 Outlet+드로어만,
// 변형 없는 라우트엔 폴백 MobileHeader/MobileTabBar 를 제공한다. (한쪽 트리만 렌더)

const PAGE_TO_PATH: Record<string, string> = {
  home: '/',
  products: '/products',
  story: '/story',
  mypage: '/mypage',
  login: '/login',
  cart: '/cart',
}

function pathToPage(pathname: string): string {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/products/')) return 'detail'
  if (pathname === '/products') return 'products'
  if (pathname === '/story') return 'story'
  if (pathname === '/mypage') return 'mypage'
  if (pathname === '/cart') return 'cart'
  if (pathname === '/checkout') return 'checkout'
  if (pathname === '/order/complete') return 'confirm'
  if (pathname === '/login') return 'login'
  if (pathname === '/signup') return 'signup'
  if (pathname === '/find') return 'find'
  return ''
}

// 모바일 변형이 자체 MobileHeader(/TabBar) 를 렌더하는 화면 → 레이아웃은 Outlet+드로어만.
// 모바일 변형이 없는 라우트(auth: login/signup/find)만 폴백 MobileHeader 를 받는다(탭바 없음).
const SELF_CHROME = ['home', 'products', 'detail', 'cart', 'checkout', 'confirm', 'mypage', 'story']
const NO_TABBAR = ['login', 'signup', 'find']

function ShopShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const page = pathToPage(location.pathname)
  const isMobile = useIsMobile()
  const { items, drawerOpen, openDrawer, closeDrawer, updateQty, remove } = useCart()

  const onNav = (p: string) => navigate(PAGE_TO_PATH[p] ?? '/')

  const drawer = (
    <CartDrawer
      open={drawerOpen}
      cart={items}
      onClose={closeDrawer}
      onUpdateQty={updateQty}
      onRemove={remove}
      onCheckout={() => {
        closeDrawer()
        navigate('/checkout')
      }}
    />
  )

  if (isMobile) {
    const selfChrome = SELF_CHROME.includes(page)
    const showTabBar = !selfChrome && !NO_TABBAR.includes(page)
    return (
      <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingBottom: showTabBar ? 64 : 0 }}>
        {!selfChrome && <MobileHeader cart={items} onCart={openDrawer} />}
        <Outlet />
        {showTabBar && <MobileTabBar page={page} onNav={onNav} cart={items} />}
        {drawer}
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DesktopHeader page={page} cart={items} onNav={onNav} onOpenCart={() => navigate('/cart')} />
      <Outlet />
      <DesktopFooter />
      {drawer}
    </div>
  )
}

export default function ShopLayout() {
  return (
    <CartProvider>
      <ToastProvider>
        <ShopShell />
      </ToastProvider>
    </CartProvider>
  )
}
