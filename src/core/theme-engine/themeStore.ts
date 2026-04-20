import { create } from 'zustand';
import type { ThemeConfig } from '../../types';

interface ThemeStore {
  themeName: string;
  theme: ThemeConfig;
  particleCount: number;
  scanlineIntensity: number;
  lowPowerMode: boolean;
  setTheme: (name: string, config: ThemeConfig) => void;
  setParticleCount: (count: number) => void;
  setScanlineIntensity: (intensity: number) => void;
  setLowPowerMode: (enabled: boolean) => void;
}

import { cyberpunkTheme } from './themes/cyberpunk';

export const useThemeStore = create<ThemeStore>((set) => ({
  themeName: 'cyberpunk',
  theme: cyberpunkTheme,
  particleCount: cyberpunkTheme.effects.particleDensity * 160,
  scanlineIntensity: cyberpunkTheme.effects.glowIntensity,
  lowPowerMode: false,

  setTheme: (name, config) =>
    set({
      themeName: name,
      theme: config,
      particleCount: config.effects.particleDensity * 160,
      scanlineIntensity: config.effects.glowIntensity,
    }),

  setParticleCount: (count) => set({ particleCount: count }),
  setScanlineIntensity: (intensity) => set({ scanlineIntensity: intensity }),
  setLowPowerMode: (enabled) => set({ lowPowerMode: enabled }),
}));
