import { create } from 'zustand';
import type { WindowState, TerminalType, TerminalConfig, Size2D } from '../../types';
import { usePluginStore } from '../plugin-system';
import { computeArrangedLayout } from './tileWindows';
import { Z_INDEX_BASE, WINDOW_CASCADE_OFFSET } from '../constants';

let zIndexCounter = Z_INDEX_BASE;
let windowIdCounter = 0;

const TERMINAL_CONFIGS: Record<string, { title: string; defaultSize: Size2D }> = {
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
  'opencli': { title: 'OpenCLI', defaultSize: { width: 520, height: 340 } },
};

// Get terminal config, supporting both built-in and plugin terminals
const getTerminalConfig = (type: TerminalType): { title: string; defaultSize: Size2D } => {
  // Check built-in first
  if (TERMINAL_CONFIGS[type]) {
    return TERMINAL_CONFIGS[type];
  }

  // Check plugin registry
  const plugin = usePluginStore.getState().getPlugin(type);
  if (plugin) {
    return {
      title: plugin.manifest.name,
      defaultSize: plugin.manifest.defaultSize,
    };
  }

  // Fallback for unknown types
  return {
    title: type,
    defaultSize: { width: 520, height: 340 },
  };
};

interface WindowStore {
  windows: WindowState[];
  createWindow: (type: TerminalType, config?: TerminalConfig, overrides?: { position?: { x: number; y: number }; size?: { width: number; height: number } }) => void;
  closeWindow: (id: string) => void;
  closeAllWindows: () => void;
  focusWindow: (id: string) => void;
  blurAllWindows: () => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  renameWindow: (id: string, title: string) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  arrangeWindows: () => void;
  clearWindows: () => void;
  setWindows: (windows: WindowState[]) => void;
}

export const useWindowStore = create<WindowStore>((set) => ({
  windows: [],

  createWindow: (type, config = {}, overrides = {}) => {
    const cfg = getTerminalConfig(type);
    const id = `win-${++windowIdCounter}`;
    const offset = (windowIdCounter % 5) * WINDOW_CASCADE_OFFSET;

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

  closeAllWindows: () =>
    set(() => ({
      windows: [],
    })),

  focusWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => ({
        ...w,
        isFocused: w.id === id,
        zIndex: w.id === id ? ++zIndexCounter : w.zIndex,
      })),
    })),

  blurAllWindows: () =>
    set((state) => ({
      windows: state.windows.map((w) => ({ ...w, isFocused: false })),
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

  renameWindow: (id, title) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, title } : w
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

  arrangeWindows: () =>
    set((state) => {
      const layouts = computeArrangedLayout(
        state.windows,
        window.innerWidth,
        window.innerHeight - 36
      );
      const layoutMap = new Map(layouts.map((l) => [l.id, l]));
      return {
        windows: state.windows.map((w) => {
          const layout = layoutMap.get(w.id);
          if (!layout || w.isMaximized) return w;
          return {
            ...w,
            position: layout.position,
            size: layout.size,
            isMinimized: false,
          };
        }),
      };
    }),

  clearWindows: () =>
    set(() => ({
      windows: [],
    })),

  setWindows: (windows) =>
    set(() => ({
      windows,
    })),
}));
