// MICOZ Admin — app shell + router

const { useState: useStateApp } = React;

function AdminApp() {
  const [page, setPage] = useStateApp('dashboard');

  const meta = {
    dashboard:  { title: '대시보드',        crumbs: ['HOME', 'OVERVIEW'] },
    members:    { title: '회원관리',        crumbs: ['HOME', 'MEMBERS'] },
    categories: { title: '카테고리 관리',   crumbs: ['HOME', 'CATALOG', 'CATEGORIES'] },
    products:   { title: '상품관리',        crumbs: ['HOME', 'CATALOG', 'PRODUCTS'] },
    orders:     { title: '주문관리',        crumbs: ['HOME', 'COMMERCE', 'ORDERS'] },
    returns:    { title: '반품·교환 관리',  crumbs: ['HOME', 'COMMERCE', 'RETURNS'] },
    inquiries:  { title: '1:1 문의',        crumbs: ['HOME', 'SUPPORT', 'INQUIRIES'] },
    banner:   { title: '메인 배너 설정',    crumbs: ['HOME', 'SETTINGS', 'BANNER'] },
    shipping: { title: '배송 설정',        crumbs: ['HOME', 'SETTINGS', 'SHIP'] },
    team:     { title: '관리자 계정 관리', crumbs: ['HOME', 'SETTINGS', 'TEAM'] },
  }[page];

  const rightExtra = page === 'dashboard' ? (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px',
      background: '#fff',
      border: '1px solid var(--ad-line)',
      fontFamily: 'var(--mono)', fontSize: 11.5,
      letterSpacing: '0.06em',
      color: 'var(--ad-ink)',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3a8a5a' }}/>
      LIVE · 2026-05-20 14:32 KST
    </div>
  ) : null;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--ad-paper)',
      color: 'var(--ad-ink)',
      fontFamily: 'var(--sans)',
    }}>
      <Sidebar current={page} onNav={setPage}/>
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar title={meta.title} crumbs={meta.crumbs} rightExtra={rightExtra}/>
        <div style={{ flex: 1 }}>
          {page === 'dashboard'  && <DashboardView/>}
          {page === 'members'    && <MembersView/>}
          {page === 'categories' && <CategoriesView/>}
          {page === 'products'   && <ProductsView/>}
          {page === 'orders'     && <OrdersView/>}
          {page === 'returns'    && <ReturnsView/>}
          {page === 'inquiries'  && <InquiriesView/>}
          {page === 'banner'     && <SettingsMain/>}
          {page === 'shipping'   && <SettingsShipping/>}
          {page === 'team'       && <SettingsTeam/>}
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp/>);
