import { cyberpunkTheme } from './cyberpunk';
import { matrixTheme } from './matrix';
import { amberTheme } from './amber';
import type { ThemeConfig } from '../../../types';

export const THEMES: Record<string, ThemeConfig> = {
  cyberpunk: cyberpunkTheme,
  matrix: matrixTheme,
  amber: amberTheme,
};

export function getTheme(name: string): ThemeConfig {
  return THEMES[name] || cyberpunkTheme;
}
