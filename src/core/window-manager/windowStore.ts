import { create } from 'zustand';
import type { WindowState, TerminalType, TerminalConfig, Size2D } from '../../types';

let zIndexCounter = 100;
let windowIdCounter = 0;

const TERMINAL_CONFIGS: Record<TerminalType, { title: string; defaultSize: Size2D }> = {
  'system-monitor': { title: 'System Monitor', defaultSize: { width: 520, height: 440 } },
  'shell': { title: 'Shell', defaultSize: { width: 520, height: 340 } },
  'log-viewer': { title: 'Log Viewer', defaultSize: { width: 480, height: 320 } },
  'file-manager': { title: 'File Manager', defaultSize: { width: 460, height: 360 } },
  'network-map': { title: 'Network Map', defaultSize: { width: 560, height: 420 } },
  'code-editor': { title: 'Code Editor', defaultSize: { width: 500, height: 350 } },
  'map': { title: 'Map Viewer', defaultSize: { width: 450, height: 340 } },
  'media-player': { title: 'Media Player', defaultSize: { width: 420, height: 280 } },
  'viewer-3d': { title: '3D Viewer', defaultSize: { width: 480, height: 380 } },
  'widget-clock': { title: 'Clock', defaultSize: { width: 200, height: 120 } },
  'settings': { title: 'Settings', defaultSize: { width: 480, height: 420 } },
};

interface WindowStore {
  windows: WindowState[];
  createWindow: (type: TerminalType, config?: TerminalConfig, overrides?: { position?: { x: number; y: number }; size?: { width: number; height: number } }) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  clearWindows: () => void;
  setWindows: (windows: WindowState[]) => void;
}

export const useWindowStore = create<WindowStore>((set) => ({
  windows: [],

  createWindow: (type, config = {}, overrides = {}) => {
    const cfg = TERMINAL_CONFIGS[type];
    const id = `win-${++windowIdCounter}`;
    const offset = (windowIdCounter % 5) * 30;

    set((state) => ({
      windows: [
        ...state.windows,
        {
          id,
          type,
          title: cfg.title,
          position: overrides.position ?? { x: 80 + offset, y: 60 + offset },
          size: overrides.size ?? { ...cfg.defaultSize },
          isMinimized: false,
          isMaximized: false,
          isFocused: true,
          isVisible: true,
          zIndex: ++zIndexCounter,
          config,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    }));
  },

  closeWindow: (id) =>
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
    })),

  focusWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => ({
        ...w,
        isFocused: w.id === id,
        zIndex: w.id === id ? ++zIndexCounter : w.zIndex,
      })),
    })),

  updateWindowPosition: (id, position) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, position, updatedAt: Date.now() } : w
      ),
    })),

  updateWindowSize: (id, size) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, size, updatedAt: Date.now() } : w
      ),
    })),

  toggleMinimize: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
      ),
    })),

  toggleMaximize: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.isMaximized) {
          return {
            ...w,
            isMaximized: false,
            position: w.prevPosition || w.position,
            size: w.prevSize || w.size,
          };
        }
        return {
          ...w,
          isMaximized: true,
          prevPosition: { ...w.position },
          prevSize: { ...w.size },
          position: { x: 0, y: 0 },
          size: { width: window.innerWidth, height: window.innerHeight - 36 },
        };
      }),
    })),

  clearWindows: () =>
    set(() => ({
      windows: [],
    })),

  setWindows: (windows) =>
    set(() => ({
      windows,
    })),
}));
