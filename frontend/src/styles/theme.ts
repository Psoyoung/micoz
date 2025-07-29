import { DefaultTheme } from 'styled-components';
import { colors, typography, spacing, borderRadius, shadows, breakpoints, zIndex } from './tokens';

export const theme: DefaultTheme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  // Additional theme properties
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
  grid: {
    container: '1200px',
    gutter: '24px',
  },
};

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: typeof colors;
    typography: typeof typography;
    spacing: typeof spacing;
    borderRadius: typeof borderRadius;
    shadows: typeof shadows;
    breakpoints: typeof breakpoints;
    zIndex: typeof zIndex;
    transitions: {
      fast: string;
      normal: string;
      slow: string;
    };
    grid: {
      container: string;
      gutter: string;
    };
  }
}