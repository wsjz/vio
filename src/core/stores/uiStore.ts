// src/core/stores/uiStore.ts

import { create } from 'zustand';
import type { Vector2D } from '../types';

export interface DragState {
  active: boolean;
  containerId: string | null;
  startPosition: Vector2D;
  currentOffset: Vector2D;
  previewPosition: Vector2D;
  previewSize: { width: number; height: number };
}

interface UiState {
  // Drag
  drag: DragState;
  startDrag: (containerId: string, position: Vector2D, size: { width: number; height: number }) => void;
  updateDrag: (offset: Vector2D) => void;
  endDrag: () => void;

  // Launcher
  launcherVisible: boolean;
  setLauncherVisible: (visible: boolean) => void;
  toggleLauncher: () => void;

  // AppGrid
  appGridVisible: boolean;
  setAppGridVisible: (visible: boolean) => void;

  // Context Menu
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    items: { label: string; onClick: () => void; divider?: boolean }[];
  };
  showContextMenu: (x: number, y: number, items: { label: string; onClick: () => void; divider?: boolean }[]) => void;
  hideContextMenu: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  drag: {
    active: false,
    containerId: null,
    startPosition: { x: 0, y: 0 },
    currentOffset: { x: 0, y: 0 },
    previewPosition: { x: 0, y: 0 },
    previewSize: { width: 0, height: 0 },
  },

  startDrag: (containerId, position, size) =>
    set({
      drag: {
        active: true,
        containerId,
        startPosition: { ...position },
        currentOffset: { x: 0, y: 0 },
        previewPosition: { ...position },
        previewSize: { ...size },
      },
    }),

  updateDrag: (offset) =>
    set((state) => {
      if (!state.drag.active) return state;
      return {
        drag: {
          ...state.drag,
          currentOffset: { ...offset },
          previewPosition: {
            x: state.drag.startPosition.x + offset.x,
            y: state.drag.startPosition.y + offset.y,
          },
        },
      };
    }),

  endDrag: () =>
    set({
      drag: {
        active: false,
        containerId: null,
        startPosition: { x: 0, y: 0 },
        currentOffset: { x: 0, y: 0 },
        previewPosition: { x: 0, y: 0 },
        previewSize: { width: 0, height: 0 },
      },
    }),

  launcherVisible: false,
  setLauncherVisible: (visible) => set({ launcherVisible: visible }),
  toggleLauncher: () => set((s) => ({ launcherVisible: !s.launcherVisible })),

  appGridVisible: false,
  setAppGridVisible: (visible) => set({ appGridVisible: visible }),

  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    items: [],
  },

  showContextMenu: (x, y, items) =>
    set({
      contextMenu: { visible: true, x, y, items },
    }),

  hideContextMenu: () =>
    set((s) => ({
      contextMenu: { ...s.contextMenu, visible: false },
    })),
}));
