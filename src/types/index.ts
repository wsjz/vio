export interface Vector2D {
  x: number;
  y: number;
}

export interface Size2D {
  width: number;
  height: number;
}

export type TerminalType =
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
  | 'settings';

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
