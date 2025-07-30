import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { Provider } from 'react-redux';
import { store } from './store';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
import { Header, Footer } from './components';
import { HomePage } from './pages/HomePage';
import { SkincareCategory, MakeupCategory, BodycareCategory, FragranceCategory, ProductDetailPage } from './pages';

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
            </Routes>
          </main>
          <Footer />
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;