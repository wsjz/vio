import type { ThemeConfig } from '../../../types';

const accentDim = 'rgba(0, 240, 255, 0.3)';
const accentGlow = 'rgba(0, 240, 255, 0.15)';

export const cyberpunkTheme: ThemeConfig = {
  name: 'Cyberpunk',
  colors: {
    accent: '#00f0ff',
    accentDim,
    accentGlow,
    bgPrimary: '#0a0a0f',
    bgSecondary: '#12121a',
    bgTertiary: '#1a1a25',
    textPrimary: '#e8e8e8',
    textSecondary: '#a0a0a0',
    textTertiary: '#606060',
    borderDefault: 'rgba(0, 240, 255, 0.12)',
    borderFocus: 'rgba(0, 240, 255, 0.4)',
    // Precomputed variants
    accentDim50: 'rgba(0, 240, 255, 0.5)',
    accentDim15: 'rgba(0, 240, 255, 0.15)',
    accentDim10: 'rgba(0, 240, 255, 0.1)',
    accentDim20: 'rgba(0, 240, 255, 0.2)',
    accentDim08: 'rgba(0, 240, 255, 0.08)',
    accentDim06: 'rgba(0, 240, 255, 0.06)',
    accentGlow25: 'rgba(0, 240, 255, 0.25)',
    accentGlow12: 'rgba(0, 240, 255, 0.12)',
    accentGlow10: 'rgba(0, 240, 255, 0.1)',
    accentGlow08: 'rgba(0, 240, 255, 0.08)',
    accentGlow06: 'rgba(0, 240, 255, 0.06)',
    accentGlow03: 'rgba(0, 240, 255, 0.03)',
    accentGlow30: 'rgba(0, 240, 255, 0.3)',
    accentGlow04: 'rgba(0, 240, 255, 0.04)',
    accentGlow15: 'rgba(0, 240, 255, 0.15)',
    accentGlow20: 'rgba(0, 240, 255, 0.2)',
    accentGlow40: 'rgba(0, 240, 255, 0.4)',
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
