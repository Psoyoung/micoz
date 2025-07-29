import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
    font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
    color: ${({ theme }) => theme.colors.secondary.charcoal};
    background-color: ${({ theme }) => theme.colors.secondary.ivory};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  /* English text styling */
  *[lang="en"], .en {
    font-family: ${({ theme }) => theme.typography.fontFamily.primary.english};
  }

  /* Secondary font styling */
  .font-secondary {
    font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  }

  .font-secondary[lang="en"], .font-secondary.en {
    font-family: ${({ theme }) => theme.typography.fontFamily.secondary.english};
  }

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    line-height: ${({ theme }) => theme.typography.lineHeight.tight};
    color: ${({ theme }) => theme.colors.primary.deepForest};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }

  h1[lang="en"], h2[lang="en"], h3[lang="en"], h4[lang="en"], h5[lang="en"], h6[lang="en"],
  h1.en, h2.en, h3.en, h4.en, h5.en, h6.en {
    font-family: ${({ theme }) => theme.typography.fontFamily.secondary.english};
  }

  h1 { font-size: ${({ theme }) => theme.typography.fontSize['5xl']}; }
  h2 { font-size: ${({ theme }) => theme.typography.fontSize['4xl']}; }
  h3 { font-size: ${({ theme }) => theme.typography.fontSize['3xl']}; }
  h4 { font-size: ${({ theme }) => theme.typography.fontSize['2xl']}; }
  h5 { font-size: ${({ theme }) => theme.typography.fontSize.xl}; }
  h6 { font-size: ${({ theme }) => theme.typography.fontSize.lg}; }

  /* Paragraphs */
  p {
    margin-bottom: ${({ theme }) => theme.spacing[4]};
    color: ${({ theme }) => theme.colors.gray[700]};
  }

  /* Links */
  a {
    color: ${({ theme }) => theme.colors.primary.sage};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.fast};

    &:hover {
      color: ${({ theme }) => theme.colors.primary.deepForest};
      text-decoration: underline;
    }

    &:focus {
      outline: 2px solid ${({ theme }) => theme.colors.primary.sage};
      outline-offset: 2px;
    }
  }

  /* Lists */
  ul, ol {
    margin-bottom: ${({ theme }) => theme.spacing[4]};
    padding-left: ${({ theme }) => theme.spacing[6]};
  }

  li {
    margin-bottom: ${({ theme }) => theme.spacing[2]};
  }

  /* Code */
  code, pre {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    background-color: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.gray[800]};
  }

  code {
    padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    font-size: 0.875em;
  }

  pre {
    padding: ${({ theme }) => theme.spacing[4]};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    overflow-x: auto;
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }

  /* Form elements */
  input, textarea, select, button {
    font-family: inherit;
  }

  /* Focus styles */
  *:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.sage};
    outline-offset: 2px;
  }

  /* Root container */
  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }

  /* Responsive design helpers */
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    html {
      font-size: 14px;
    }
    
    h1 { font-size: ${({ theme }) => theme.typography.fontSize['3xl']}; }
    h2 { font-size: ${({ theme }) => theme.typography.fontSize['2xl']}; }
    h3 { font-size: ${({ theme }) => theme.typography.fontSize.xl}; }
  }
`;