import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../../components/admin/Sidebar'
import Topbar from '../../components/admin/Topbar'
import { useAdminAuth } from '../../auth/AdminAuthContext'

// 관리자 레이아웃 — .admin-scope(--ad-* 토큰군) + 실제 Sidebar/Topbar.
// 사이드바는 onNav/current(원본 API) 유지, 여기서 react-router 와 연결.

type Meta = { path: string; title: string; crumbs: string[] }

const META: Record<string, Meta> = {
  dashboard: { path: '/admin', title: '대시보드', crumbs: ['HOME', 'OVERVIEW'] },
  members: { path: '/admin/members', title: '회원관리', crumbs: ['HOME', 'MEMBERS'] },
  categories: { path: '/admin/categories', title: '카테고리 관리', crumbs: ['HOME', 'CATALOG', 'CATEGORIES'] },
  products: { path: '/admin/products', title: '상품관리', crumbs: ['HOME', 'CATALOG', 'PRODUCTS'] },
  orders: { path: '/admin/orders', title: '주문관리', crumbs: ['HOME', 'COMMERCE', 'ORDERS'] },
  returns: { path: '/admin/returns', title: '반품·교환 관리', crumbs: ['HOME', 'COMMERCE', 'RETURNS'] },
  inquiries: { path: '/admin/inquiries', title: '1:1 문의', crumbs: ['HOME', 'SUPPORT', 'INQUIRIES'] },
  banner: { path: '/admin/settings/banner', title: '메인 배너 설정', crumbs: ['HOME', 'SETTINGS', 'BANNER'] },
  shipping: { path: '/admin/settings/shipping', title: '배송 설정', crumbs: ['HOME', 'SETTINGS', 'SHIP'] },
  team: { path: '/admin/settings/team', title: '관리자 계정 관리', crumbs: ['HOME', 'SETTINGS', 'TEAM'] },
}

function pathToKey(pathname: string): string {
  const found = Object.keys(META).find((k) => META[k].path === pathname)
  return found ?? 'dashboard'
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAdminAuth()
  const current = pathToKey(location.pathname)
  const meta = META[current]

  const rightExtra =
    current === 'dashboard' ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#fff', border: '1px solid var(--ad-line)', fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: '0.06em', color: 'var(--ad-ink)', whiteSpace: 'nowrap' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3a8a5a' }} />
        LIVE · 2026-05-20 14:32 KST
      </div>
    ) : null

  return (
    <div className="admin-scope" style={{ display: 'flex', minHeight: '100vh', background: 'var(--ad-paper)', color: 'var(--ad-ink)', fontFamily: 'var(--sans)' }}>
      <Sidebar current={current} onNav={(key) => navigate(META[key].path)} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar title={meta.title} crumbs={meta.crumbs} rightExtra={rightExtra} onLogout={logout} />
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
