import type { ThemeConfig } from '../../../types';

export const amberTheme: ThemeConfig = {
  name: 'Amber',
  colors: {
    accent: '#ffb000',
    accentDim: 'rgba(255, 176, 0, 0.3)',
    accentGlow: 'rgba(255, 176, 0, 0.15)',
    bgPrimary: '#0f0a00',
    bgSecondary: '#1a1205',
    bgTertiary: '#251a0a',
    textPrimary: '#ffe8c0',
    textSecondary: '#c4a060',
    textTertiary: '#806030',
    borderDefault: 'rgba(255, 176, 0, 0.12)',
    borderFocus: 'rgba(255, 176, 0, 0.4)',
  },
  font: {
    display: 'Orbitron, sans-serif',
    mono: 'JetBrains Mono, monospace',
    ui: 'Rajdhani, sans-serif',
  },
  effects: {
    scanline: true,
    particleDensity: 0.4,
    glowIntensity: 0.7,
  },
};
