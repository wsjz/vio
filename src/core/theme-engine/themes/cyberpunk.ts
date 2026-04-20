import type { ThemeConfig } from '../../../types';

export const cyberpunkTheme: ThemeConfig = {
  name: 'Cyberpunk',
  colors: {
    accent: '#00f0ff',
    accentDim: 'rgba(0, 240, 255, 0.3)',
    accentGlow: 'rgba(0, 240, 255, 0.15)',
    bgPrimary: '#0a0a0f',
    bgSecondary: '#12121a',
    bgTertiary: '#1a1a25',
    textPrimary: '#e8e8e8',
    textSecondary: '#a0a0a0',
    textTertiary: '#606060',
    borderDefault: 'rgba(0, 240, 255, 0.12)',
    borderFocus: 'rgba(0, 240, 255, 0.4)',
  },
  font: {
    display: 'Orbitron, sans-serif',
    mono: 'JetBrains Mono, monospace',
    ui: 'Rajdhani, sans-serif',
  },
  effects: {
    scanline: true,
    particleDensity: 0.5,
    glowIntensity: 0.8,
  },
};
