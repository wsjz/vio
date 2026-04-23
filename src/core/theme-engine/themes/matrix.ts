import type { ThemeConfig } from '../../../types';

const accentDim = 'rgba(0, 255, 65, 0.3)';
const accentGlow = 'rgba(0, 255, 65, 0.15)';

export const matrixTheme: ThemeConfig = {
  name: 'Matrix',
  colors: {
    accent: '#00ff41',
    accentDim,
    accentGlow,
    bgPrimary: '#020802',
    bgSecondary: '#051005',
    bgTertiary: '#0a1a0a',
    textPrimary: '#e0ffe0',
    textSecondary: '#88cc88',
    textTertiary: '#448844',
    borderDefault: 'rgba(0, 255, 65, 0.12)',
    borderFocus: 'rgba(0, 255, 65, 0.4)',
    // Precomputed variants
    accentDim50: 'rgba(0, 255, 65, 0.5)',
    accentDim15: 'rgba(0, 255, 65, 0.15)',
    accentDim10: 'rgba(0, 255, 65, 0.1)',
    accentDim20: 'rgba(0, 255, 65, 0.2)',
    accentDim08: 'rgba(0, 255, 65, 0.08)',
    accentDim06: 'rgba(0, 255, 65, 0.06)',
    accentGlow25: 'rgba(0, 255, 65, 0.25)',
    accentGlow12: 'rgba(0, 255, 65, 0.12)',
    accentGlow10: 'rgba(0, 255, 65, 0.1)',
    accentGlow08: 'rgba(0, 255, 65, 0.08)',
    accentGlow06: 'rgba(0, 255, 65, 0.06)',
    accentGlow03: 'rgba(0, 255, 65, 0.03)',
    accentGlow30: 'rgba(0, 255, 65, 0.3)',
    accentGlow04: 'rgba(0, 255, 65, 0.04)',
    accentGlow15: 'rgba(0, 255, 65, 0.15)',
    accentGlow20: 'rgba(0, 255, 65, 0.2)',
    accentGlow40: 'rgba(0, 255, 65, 0.4)',
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
