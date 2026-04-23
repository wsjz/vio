export interface Vector2D {
  x: number;
  y: number;
}

export interface Size2D {
  width: number;
  height: number;
}

export type BuiltinTerminalType =
  | 'system-monitor'
  | 'shell'
  | 'log-viewer'
  | 'network-map'
  | 'media-player'
  | 'viewer-3d'
  | 'map'
  | 'file-manager'
  | 'code-editor'
  | 'widget-clock'
  | 'settings'
  | 'opencli';

export type TerminalType = BuiltinTerminalType | string;

export interface TerminalConfig {
  refreshRate?: number;
  metrics?: ('cpu' | 'memory' | 'disk' | 'network')[];
  targetHost?: string;
  shellType?: 'local' | 'ssh';
  sshConfig?: { host: string; port: number; username: string };
  logPath?: string;
  filterPattern?: string;
}

export interface WindowState {
  id: string;
  type: TerminalType;
  title: string;
  position: Vector2D;
  size: Size2D;
  prevPosition?: Vector2D;
  prevSize?: Size2D;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  isVisible: boolean;
  zIndex: number;
  config: TerminalConfig;
  theme?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TerminalMeta {
  type: TerminalType;
  name: string;
  description: string;
  icon: string;
  defaultSize: Size2D;
  minSize: Size2D;
  category: 'monitor' | 'command' | 'visualization' | 'tool' | 'widget';
  requiresBackend: boolean;
}

export interface ThemeConfig {
  name: string;
  colors: {
    accent: string;
    accentDim: string;
    accentGlow: string;
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    borderDefault: string;
    borderFocus: string;
    /** Precomputed variant: accentDim with alpha 0.5 */
    accentDim50: string;
    /** Precomputed variant: accentDim with alpha 0.15 */
    accentDim15: string;
    /** Precomputed variant: accentDim with alpha 0.1 */
    accentDim10: string;
    /** Precomputed variant: accentDim with alpha 0.2 */
    accentDim20: string;
    /** Precomputed variant: accentDim with alpha 0.08 */
    accentDim08: string;
    /** Precomputed variant: accentDim with alpha 0.06 */
    accentDim06: string;
    /** Precomputed variant: accentGlow with alpha 0.25 */
    accentGlow25: string;
    /** Precomputed variant: accentGlow with alpha 0.12 */
    accentGlow12: string;
    /** Precomputed variant: accentGlow with alpha 0.1 */
    accentGlow10: string;
    /** Precomputed variant: accentGlow with alpha 0.08 */
    accentGlow08: string;
    /** Precomputed variant: accentGlow with alpha 0.06 */
    accentGlow06: string;
    /** Precomputed variant: accentGlow with alpha 0.03 */
    accentGlow03: string;
    /** Precomputed variant: accentGlow with alpha 0.3 */
    accentGlow30: string;
    /** Precomputed variant: accentGlow with alpha 0.04 */
    accentGlow04: string;
    /** Precomputed variant: accentGlow with alpha 0.15 */
    accentGlow15: string;
    /** Precomputed variant: accentGlow with alpha 0.4 */
    accentGlow40: string;
    /** Precomputed variant: accentGlow with alpha 0.2 */
    accentGlow20: string;
  };
  font: {
    display: string;
    mono: string;
    ui: string;
  };
  effects: {
    scanline: boolean;
    particleDensity: number;
    glowIntensity: number;
  };
}
