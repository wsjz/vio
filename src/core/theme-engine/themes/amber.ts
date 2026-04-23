import type { ThemeConfig } from '../../../types';

const accentDim = 'rgba(255, 176, 0, 0.3)';
const accentGlow = 'rgba(255, 176, 0, 0.15)';

export const amberTheme: ThemeConfig = {
  name: 'Amber',
  colors: {
    accent: '#ffb000',
    accentDim,
    accentGlow,
    bgPrimary: '#0f0a00',
    bgSecondary: '#1a1205',
    bgTertiary: '#251a0a',
    textPrimary: '#ffe8c0',
    textSecondary: '#c4a060',
    textTertiary: '#806030',
    borderDefault: 'rgba(255, 176, 0, 0.12)',
    borderFocus: 'rgba(255, 176, 0, 0.4)',
    // Precomputed variants
    accentDim50: 'rgba(255, 176, 0, 0.5)',
    accentDim15: 'rgba(255, 176, 0, 0.15)',
    accentDim10: 'rgba(255, 176, 0, 0.1)',
    accentDim20: 'rgba(255, 176, 0, 0.2)',
    accentDim08: 'rgba(255, 176, 0, 0.08)',
    accentDim06: 'rgba(255, 176, 0, 0.06)',
    accentGlow25: 'rgba(255, 176, 0, 0.25)',
    accentGlow12: 'rgba(255, 176, 0, 0.12)',
    accentGlow10: 'rgba(255, 176, 0, 0.1)',
    accentGlow08: 'rgba(255, 176, 0, 0.08)',
    accentGlow06: 'rgba(255, 176, 0, 0.06)',
    accentGlow03: 'rgba(255, 176, 0, 0.03)',
    accentGlow30: 'rgba(255, 176, 0, 0.3)',
    accentGlow04: 'rgba(255, 176, 0, 0.04)',
    accentGlow15: 'rgba(255, 176, 0, 0.15)',
    accentGlow20: 'rgba(255, 176, 0, 0.2)',
    accentGlow40: 'rgba(255, 176, 0, 0.4)',
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
