import React from 'react';
import { ThemeProvider } from 'styled-components';
import { Provider } from 'react-redux';
import { store } from './store';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
import { Button, Card, Input } from './components';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h1>MICOZ Design System</h1>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2>Typography</h2>
            <p>This is a paragraph with the default Korean/English font (Pretendard/Inter).</p>
            <p className="font-secondary">This is a paragraph with the secondary Korean/English font (Noto Serif KR/Playfair Display).</p>
            <p lang="en">This is English text using Inter font.</p>
            <p lang="en" className="font-secondary">This is English text using Playfair Display font.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>Buttons</h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="text">Text Button</Button>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <Button size="small">Small</Button>
              <Button size="medium">Medium</Button>
              <Button size="large">Large</Button>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>Cards</h2>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              <Card variant="default" hover>
                <h3>Default Card</h3>
                <p>This is a default card with hover effect.</p>
              </Card>
              <Card variant="elevated">
                <h3>Elevated Card</h3>
                <p>This is an elevated card with stronger shadow.</p>
              </Card>
              <Card variant="outlined" clickable>
                <h3>Outlined Card</h3>
                <p>This is a clickable outlined card.</p>
              </Card>
            </div>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>Form Inputs</h2>
            <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
              <Input 
                label="Default Input" 
                placeholder="Enter text..." 
                fullWidth 
              />
              <Input 
                label="Email Input" 
                type="email" 
                placeholder="Enter email..." 
                variant="outlined" 
                fullWidth 
              />
              <Input 
                label="Filled Input" 
                placeholder="Enter text..." 
                variant="filled" 
                fullWidth 
              />
              <Input 
                label="Required Field" 
                placeholder="This field is required" 
                required 
                fullWidth 
              />
              <Input 
                label="Error State" 
                placeholder="Invalid input" 
                error 
                errorMessage="This field has an error" 
                fullWidth 
              />
            </div>
          </section>
        </div>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
