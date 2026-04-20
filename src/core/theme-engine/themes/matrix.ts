import type { ThemeConfig } from '../../../types';

export const matrixTheme: ThemeConfig = {
  name: 'Matrix',
  colors: {
    accent: '#00ff41',
    accentDim: 'rgba(0, 255, 65, 0.3)',
    accentGlow: 'rgba(0, 255, 65, 0.15)',
    bgPrimary: '#020802',
    bgSecondary: '#051005',
    bgTertiary: '#0a1a0a',
    textPrimary: '#e0ffe0',
    textSecondary: '#88cc88',
    textTertiary: '#448844',
    borderDefault: 'rgba(0, 255, 65, 0.12)',
    borderFocus: 'rgba(0, 255, 65, 0.4)',
  },
  font: {
    display: 'Orbitron, sans-serif',
    mono: 'JetBrains Mono, monospace',
    ui: 'Rajdhani, sans-serif',
  },
  effects: {
    scanline: true,
    particleDensity: 0.6,
    glowIntensity: 0.5,
  },
};
