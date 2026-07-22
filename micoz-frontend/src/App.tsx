import { Routes, Route, Outlet } from 'react-router-dom'
import ShopLayout from './routes/shop/ShopLayout'
import AdminLayout from './routes/admin/AdminLayout'
import Placeholder from './components/ui/Placeholder'
import RequireAuth from './auth/RequireAuth'
import RequireAdmin from './auth/RequireAdmin'
import { AdminAuthProvider } from './auth/AdminAuthContext'
import AdminLoginPage from './routes/admin/auth/AdminLoginPage'
import HomePage from './routes/shop/HomePage'
import ProductsPage from './routes/shop/ProductsPage'
import ProductDetail from './routes/shop/ProductDetail'
import CartPage from './routes/shop/CartPage'
import CheckoutPage from './routes/shop/checkout/CheckoutPage'
import OrderComplete from './routes/shop/OrderComplete'
import StoryPage from './routes/shop/StoryPage'
import MyPage from './routes/shop/mypage/MyPage'
import LoginPage from './routes/shop/auth/LoginPage'
import SignupPage from './routes/shop/auth/SignupPage'
import FindIdPwPage from './routes/shop/auth/FindIdPwPage'
import DashboardView from './routes/admin/dashboard/DashboardView'
import MembersView from './routes/admin/members/MembersView'
import CategoriesView from './routes/admin/categories/CategoriesView'
import ProductsView from './routes/admin/products/ProductsView'
import OrdersView from './routes/admin/orders/OrdersView'
import ReturnsView from './routes/admin/returns/ReturnsView'
import InquiriesView from './routes/admin/inquiries/InquiriesView'
import BannerView from './routes/admin/settings/BannerView'
import ShippingView from './routes/admin/settings/ShippingView'
import TeamView from './routes/admin/settings/TeamView'

// MICOZ 라우터 — react-router 수동 정의.
// 모든 페이지는 현재 Placeholder. 이식 단계에서 실제 페이지 컴포넌트로 교체된다.

export default function App() {
  return (
    <Routes>
      {/* ─── 쇼핑몰 "/" ─────────────────────────────── */}
      <Route element={<ShopLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="order/complete" element={<OrderComplete />} />
        <Route path="story" element={<StoryPage />} />
        <Route path="mypage" element={<RequireAuth><MyPage /></RequireAuth>} />
        {/* auth — 폴더 묶음일 뿐 라우팅엔 영향 없음 */}
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="find" element={<FindIdPwPage />} />
      </Route>

      {/* ─── 관리자 "/admin" ────────────────────────── */}
      {/* AdminAuthProvider 로 로그인·가드 하위 트리를 함께 감싼다(사용자 AuthContext 와 분리). */}
      <Route element={<AdminAuthProvider><Outlet /></AdminAuthProvider>}>
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<DashboardView />} />
          <Route path="members" element={<MembersView />} />
          <Route path="categories" element={<CategoriesView />} />
          <Route path="products" element={<ProductsView />} />
          <Route path="orders" element={<OrdersView />} />
          <Route path="returns" element={<ReturnsView />} />
          <Route path="inquiries" element={<InquiriesView />} />
          <Route path="settings/banner" element={<BannerView />} />
          <Route path="settings/shipping" element={<ShippingView />} />
          <Route path="settings/team" element={<TeamView />} />
        </Route>
      </Route>

      {/* 미정의 경로 → 홈 안내 */}
      <Route path="*" element={<Placeholder title="페이지를 찾을 수 없습니다" path="404" />} />
    </Routes>
  )
}
