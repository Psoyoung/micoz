import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { Provider } from 'react-redux';
import { store } from './store';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
import { Header, Footer } from './components';
import { CartDrawer } from './components/CartDrawer';
import { ToastNotification } from './components/ToastNotification';
import { HomePage } from './pages/HomePage';
import { SkincareCategory, MakeupCategory, BodycareCategory, FragranceCategory, ProductDetailPage } from './pages';
import { CheckoutPage } from './pages/CheckoutPage';
import { AddressManagementPage } from './pages/AddressManagementPage';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <Router>
          <Header />
          <main style={{ paddingTop: '80px' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/skincare" element={<SkincareCategory />} />
              <Route path="/makeup" element={<MakeupCategory />} />
              <Route path="/bodycare" element={<BodycareCategory />} />
              <Route path="/fragrance" element={<FragranceCategory />} />
              <Route path="/product/:slug" element={<ProductDetailPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/address" element={<AddressManagementPage />} />
            </Routes>
          </main>
          <Footer />
          <CartDrawer />
          <ToastNotification />
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;