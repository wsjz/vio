// src/core/types.ts
// Global types for the 4-layer workspace/window model

import type { TerminalType, TerminalConfig } from '../types';

// Re-export for convenience
export type { TerminalType, TerminalConfig };

// ─── Geometry ───

export interface Vector2D {
  x: number;
  y: number;
}

export interface Size2D {
  width: number;
  height: number;
}

// ─── Monitor ───

export interface MonitorInfo {
  id: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dpi: number;
  isPrimary: boolean;
}

export interface Monitor {
  id: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dpi: number;
  isPrimary: boolean;
  workspaces: Workspace[];
}

// ─── Workspace ───

export interface Workspace {
  id: string;
  index: number;
  name: string;
  isActive: boolean;
  containers: Container[];
}

// ─── Container ───

export type SnapRegion =
  | 'left-half'
  | 'right-half'
  | 'top-half'
  | 'bottom-half'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface Container {
  id: string;
  position: Vector2D;
  size: Size2D;
  prevPosition?: Vector2D;
  prevSize?: Size2D;
  snapRegion: SnapRegion | null;
  activeWindowId: string;
  windows: Window[];
  zIndex: number;
}

// ─── Window ───

export interface Window {
  id: string;
  type: TerminalType;
  title: string;
  config: TerminalConfig;
  isMinimized: boolean;
  isFocused: boolean;
  createdAt: number;
  updatedAt: number;
}

// ─── Lookup Path ───

export interface WindowPath {
  monitorId: string;
  workspaceId: string;
  containerId: string;
}

// ─── Legacy WindowState (for terminal component compatibility) ───

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
  createdAt: number;
  updatedAt: number;
}
