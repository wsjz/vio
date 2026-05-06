// src/core/stores/vioStore.ts
// The core 4-layer Zustand store: monitors -> workspaces -> containers -> windows

import { create } from 'zustand';
import type {
  Monitor,
  Workspace,
  Container,
  Window,
  WindowPath,
  TerminalType,
  TerminalConfig,
  Vector2D,
  Size2D,
  SnapRegion,
} from '../types';
import { eventBus } from '../bus/eventBus';
import { buildWindowIndex, findContainer } from '../../lib/index';
import { computeSnapGeometry, clampPosition, getCascadeOffset } from '../../lib/geometry';
import { Z_INDEX_BASE } from '../constants';

// ─── Terminal Configs ───

const TERMINAL_CONFIGS: Record<string, { title: string; defaultSize: Size2D }> = {
  'system-monitor': { title: 'System Monitor', defaultSize: { width: 520, height: 440 } },
  shell: { title: 'Shell', defaultSize: { width: 520, height: 340 } },
  'log-viewer': { title: 'Log Viewer', defaultSize: { width: 480, height: 320 } },
  'file-manager': { title: 'File Manager', defaultSize: { width: 460, height: 360 } },
  'network-map': { title: 'Network Map', defaultSize: { width: 560, height: 420 } },
  'code-editor': { title: 'Code Editor', defaultSize: { width: 500, height: 350 } },
  map: { title: 'Map Viewer', defaultSize: { width: 450, height: 340 } },
  'media-player': { title: 'Media Player', defaultSize: { width: 420, height: 280 } },
  'viewer-3d': { title: '3D Viewer', defaultSize: { width: 480, height: 380 } },
  'widget-clock': { title: 'Clock', defaultSize: { width: 200, height: 120 } },
  settings: { title: 'Settings', defaultSize: { width: 480, height: 420 } },
  opencli: { title: 'OpenCLI', defaultSize: { width: 520, height: 340 } },
};

function getTerminalConfig(type: TerminalType): { title: string; defaultSize: Size2D } {
  return (
    TERMINAL_CONFIGS[type] || {
      title: type,
      defaultSize: { width: 520, height: 340 },
    }
  );
}

// ─── ID Counters ───

let containerIdCounter = 0;
let windowIdCounter = 0;
let zIndexCounter = Z_INDEX_BASE;

// ─── Helpers ───

function createDefaultWorkspaces(monitorId: string): Workspace[] {
  return [
    { id: `ws-${monitorId}-0`, index: 0, name: 'Alpha', isActive: true, containers: [] },
    { id: `ws-${monitorId}-1`, index: 1, name: 'Beta', isActive: false, containers: [] },
    { id: `ws-${monitorId}-2`, index: 2, name: 'Gamma', isActive: false, containers: [] },
  ];
}

function createDefaultMonitor(monitorInfo: {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  dpi: number;
  isPrimary: boolean;
}): Monitor {
  return {
    ...monitorInfo,
    workspaces: createDefaultWorkspaces(monitorInfo.id),
  };
}

// ─── Store Interface ───

interface VioState {
  monitors: Monitor[];
  index: Map<string, WindowPath>;

  // Actions
  createWindow: (type: TerminalType, config?: TerminalConfig, monitorId?: string, workspaceId?: string) => string;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  focusContainer: (containerId: string) => void;
  moveContainer: (containerId: string, position: Vector2D) => void;
  resizeContainer: (containerId: string, size: Size2D) => void;
  snapContainer: (containerId: string, region: SnapRegion) => void;
  unsnapContainer: (containerId: string) => void;
  switchWorkspace: (monitorId: string, workspaceId: string) => void;
  moveContainerToWorkspace: (containerId: string, targetWorkspaceId: string) => void;
  handleMonitorChange: (monitors: { id: string; bounds: { x: number; y: number; width: number; height: number }; dpi: number; isPrimary: boolean }[]) => void;
  setMonitors: (monitors: Monitor[]) => void;
  arrangeWindows: () => void;
  closeAllWindows: () => void;
  blurAllWindows: () => void;
  toggleMinimizeWindow: (windowId: string) => void;
  renameWindow: (windowId: string, title: string) => void;
}

// ─── Store Implementation ───

export const useVioStore = create<VioState>((set, get) => ({
  monitors: [],
  index: new Map(),

  createWindow: (type, config = {}, monitorId, workspaceId) => {
    const cfg = getTerminalConfig(type);
    const id = `win-${++windowIdCounter}`;
    const offset = getCascadeOffset(windowIdCounter);

    set((state) => {
      const monitors = [...state.monitors];
      const targetMonitor = monitorId
        ? monitors.find((m) => m.id === monitorId)
        : monitors.find((m) => m.isPrimary) || monitors[0];

      if (!targetMonitor) {
        // No monitors yet — create a fallback single-monitor setup
        const fallbackMonitor = createDefaultMonitor({
          id: 'fallback',
          bounds: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
          dpi: 1,
          isPrimary: true,
        });
        const targetWorkspace = fallbackMonitor.workspaces[0];
        const container: Container = {
          id: `cnt-${++containerIdCounter}`,
          position: { x: offset.x, y: offset.y },
          size: { ...cfg.defaultSize },
          snapRegion: null,
          activeWindowId: id,
          windows: [
            {
              id,
              type,
              title: cfg.title,
              config,
              isMinimized: false,
              isFocused: true,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          zIndex: ++zIndexCounter,
        };
        targetWorkspace.containers.push(container);
        return {
          monitors: [fallbackMonitor],
          index: buildWindowIndex([fallbackMonitor]),
        };
      }

      const targetWorkspace = workspaceId
        ? targetMonitor.workspaces.find((w) => w.id === workspaceId)
        : targetMonitor.workspaces.find((w) => w.isActive);

      if (!targetWorkspace) return state;

      // Unfocus all other windows
      for (const ws of targetMonitor.workspaces) {
        for (const c of ws.containers) {
          for (const w of c.windows) {
            w.isFocused = false;
          }
        }
      }

      const container: Container = {
        id: `cnt-${++containerIdCounter}`,
        position: { x: offset.x, y: offset.y },
        size: { ...cfg.defaultSize },
        snapRegion: null,
        activeWindowId: id,
        windows: [
          {
            id,
            type,
            title: cfg.title,
            config,
            isMinimized: false,
            isFocused: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        zIndex: ++zIndexCounter,
      };

      targetWorkspace.containers.push(container);

      const newMonitors = monitors.map((m) =>
        m.id === targetMonitor.id ? { ...targetMonitor, workspaces: [...targetMonitor.workspaces] } : m
      );

      eventBus.emit('window:created', { windowId: id, containerId: container.id });
      eventBus.emit('layout:changed');

      return {
        monitors: newMonitors,
        index: buildWindowIndex(newMonitors),
      };
    });

    return id;
  },

  closeWindow: (windowId) => {
    set((state) => {
      const path = state.index.get(windowId);
      if (!path) return state;

      const monitors = state.monitors.map((monitor) => {
        if (monitor.id !== path.monitorId) return monitor;

        const workspaces = monitor.workspaces.map((workspace) => {
          if (workspace.id !== path.workspaceId) return workspace;

          const containers = workspace.containers
            .map((container) => {
              if (container.id !== path.containerId) return container;

              const windows = container.windows.filter((w) => w.id !== windowId);
              if (windows.length === 0) return null; // Mark for removal

              return {
                ...container,
                windows,
                activeWindowId: windows[0].id,
              };
            })
            .filter((c): c is Container => c !== null);

          return { ...workspace, containers };
        });

        return { ...monitor, workspaces };
      });

      eventBus.emit('window:closed', { windowId });
      eventBus.emit('layout:changed');

      return {
        monitors,
        index: buildWindowIndex(monitors),
      };
    });
  },

  focusWindow: (windowId) => {
    set((state) => {
      const path = state.index.get(windowId);
      if (!path) return state;

      const monitors = state.monitors.map((monitor) => {
        if (monitor.id !== path.monitorId) return monitor;

        const workspaces = monitor.workspaces.map((workspace) => {
          const containers = workspace.containers.map((container) => {
            const isTargetContainer = container.id === path.containerId;
            const windows = container.windows.map((w) => ({
              ...w,
              isFocused: isTargetContainer && w.id === windowId,
            }));

            return {
              ...container,
              windows,
              activeWindowId: isTargetContainer ? windowId : container.activeWindowId,
              zIndex: isTargetContainer ? ++zIndexCounter : container.zIndex,
            };
          });

          return { ...workspace, containers };
        });

        return { ...monitor, workspaces };
      });

      eventBus.emit('window:focused', { windowId });

      return {
        monitors,
        index: buildWindowIndex(monitors),
      };
    });
  },

  focusContainer: (containerId) => {
    set((state) => {
      const found = findContainer(state.monitors, containerId);
      if (!found) return state;

      const monitors = state.monitors.map((monitor) => {
        if (monitor.id !== found.monitor.id) return monitor;

        const workspaces = monitor.workspaces.map((workspace) => {
          const containers = workspace.containers.map((container) => ({
            ...container,
            zIndex: container.id === containerId ? ++zIndexCounter : container.zIndex,
          }));

          return { ...workspace, containers };
        });

        return { ...monitor, workspaces };
      });

      return { monitors, index: state.index };
    });
  },

  moveContainer: (containerId, position) => {
    set((state) => {
      const found = findContainer(state.monitors, containerId);
      if (!found) return state;

      const monitors = state.monitors.map((monitor) => {
        if (monitor.id !== found.monitor.id) return monitor;

        const workspaces = monitor.workspaces.map((workspace) => {
          const containers = workspace.containers.map((container) =>
            container.id === containerId
              ? { ...container, position: { ...position }, updatedAt: Date.now() }
              : container
          );

          return { ...workspace, containers };
        });

        return { ...monitor, workspaces };
      });

      eventBus.emit('container:moved', { containerId, position });
      eventBus.emit('layout:changed');

      return { monitors, index: state.index };
    });
  },

  resizeContainer: (containerId, size) => {
    set((state) => {
      const found = findContainer(state.monitors, containerId);
      if (!found) return state;

      const monitors = state.monitors.map((monitor) => {
        if (monitor.id !== found.monitor.id) return monitor;

        const workspaces = monitor.workspaces.map((workspace) => {
          const containers = workspace.containers.map((container) =>
            container.id === containerId
              ? { ...container, size: { ...size }, updatedAt: Date.now() }
              : container
          );

          return { ...workspace, containers };
        });

        return { ...monitor, workspaces };
      });

      eventBus.emit('container:resized', { containerId, size });
      eventBus.emit('layout:changed');

      return { monitors, index: state.index };
    });
  },

  snapContainer: (containerId, region) => {
    set((state) => {
      const found = findContainer(state.monitors, containerId);
      if (!found) return state;

      const { position, size } = computeSnapGeometry(region, found.monitor.bounds);

      const monitors = state.monitors.map((monitor) => {
        if (monitor.id !== found.monitor.id) return monitor;

        const workspaces = monitor.workspaces.map((workspace) => {
          const containers = workspace.containers.map((container) => {
            if (container.id !== containerId) {
              // Unsnap any container already in this region
              if (container.snapRegion === region) {
                return {
                  ...container,
                  snapRegion: null,
                  position: container.prevPosition || container.position,
                  size: container.prevSize || container.size,
                };
              }
              return container;
            }

            return {
              ...container,
              prevPosition: { ...container.position },
              prevSize: { ...container.size },
              position,
              size,
              snapRegion: region,
            };
          });

          return { ...workspace, containers };
        });

        return { ...monitor, workspaces };
      });

      eventBus.emit('container:snapped', { containerId, region });
      eventBus.emit('layout:changed');

      return { monitors, index: state.index };
    });
  },

  unsnapContainer: (containerId) => {
    set((state) => {
      const found = findContainer(state.monitors, containerId);
      if (!found || !found.container.snapRegion) return state;

      const monitors = state.monitors.map((monitor) => {
        if (monitor.id !== found.monitor.id) return monitor;

        const workspaces = monitor.workspaces.map((workspace) => {
          const containers = workspace.containers.map((container) =>
            container.id === containerId
              ? {
                  ...container,
                  position: container.prevPosition || container.position,
                  size: container.prevSize || container.size,
                  snapRegion: null,
                }
              : container
          );

          return { ...workspace, containers };
        });

        return { ...monitor, workspaces };
      });

      eventBus.emit('container:unsnapped', { containerId });
      eventBus.emit('layout:changed');

      return { monitors, index: state.index };
    });
  },

  switchWorkspace: (monitorId, workspaceId) => {
    set((state) => {
      const monitors = state.monitors.map((monitor) => {
        if (monitor.id !== monitorId) return monitor;

        const workspaces = monitor.workspaces.map((workspace) => ({
          ...workspace,
          isActive: workspace.id === workspaceId,
        }));

        return { ...monitor, workspaces };
      });

      eventBus.emit('workspace:switched', { monitorId, workspaceId });

      return { monitors, index: state.index };
    });
  },

  moveContainerToWorkspace: (containerId, targetWorkspaceId) => {
    set((state) => {
      let containerToMove: Container | null = null;
      let sourceWorkspaceId = '';

      // Find and remove container from source
      const monitors = state.monitors.map((monitor) => {
        const workspaces = monitor.workspaces.map((workspace) => {
          const idx = workspace.containers.findIndex((c) => c.id === containerId);
          if (idx !== -1) {
            containerToMove = workspace.containers[idx];
            sourceWorkspaceId = workspace.id;
            return {
              ...workspace,
              containers: workspace.containers.filter((c) => c.id !== containerId),
            };
          }
          return workspace;
        });

        return { ...monitor, workspaces };
      });

      if (!containerToMove) return state;

      // Add to target workspace
      const targetMonitors = monitors.map((monitor) => {
        const workspaces = monitor.workspaces.map((workspace) => {
          if (workspace.id === targetWorkspaceId) {
            return {
              ...workspace,
              containers: [...workspace.containers, containerToMove!],
            };
          }
          return workspace;
        });

        return { ...monitor, workspaces };
      });

      eventBus.emit('workspace:containerMoved', {
        containerId,
        fromWorkspace: sourceWorkspaceId,
        toWorkspace: targetWorkspaceId,
      });
      eventBus.emit('layout:changed');

      return {
        monitors: targetMonitors,
        index: buildWindowIndex(targetMonitors),
      };
    });
  },

  handleMonitorChange: (monitorInfos) => {
    set((state) => {
      // Simple case: initialize if no monitors
      if (state.monitors.length === 0) {
        const monitors = monitorInfos.map((info) => createDefaultMonitor(info));
        return {
          monitors,
          index: buildWindowIndex(monitors),
        };
      }

      // Check for changes
      const currentIds = new Set(state.monitors.map((m) => m.id));
      const newIds = new Set(monitorInfos.map((m) => m.id));

      const added = monitorInfos.filter((m) => !currentIds.has(m.id));
      const removed = state.monitors.filter((m) => !newIds.has(m.id));

      if (added.length === 0 && removed.length === 0) {
        // Just update bounds
        const monitors = state.monitors.map((monitor) => {
          const info = monitorInfos.find((m) => m.id === monitor.id);
          if (!info) return monitor;
          return { ...monitor, bounds: info.bounds, dpi: info.dpi };
        });
        return { monitors, index: state.index };
      }

      // Build new monitor list with workspace preservation
      const monitors: Monitor[] = [];

      for (const info of monitorInfos) {
        const existing = state.monitors.find((m) => m.id === info.id);
        if (existing) {
          monitors.push({
            ...existing,
            bounds: info.bounds,
            dpi: info.dpi,
            isPrimary: info.isPrimary,
          });
        } else {
          monitors.push(createDefaultMonitor(info));
        }
      }

      // Migrate containers from removed monitors
      for (const removedMonitor of removed) {
        const primary = monitors.find((m) => m.isPrimary) || monitors[0];
        if (!primary) continue;

        const activeWs = primary.workspaces.find((w) => w.isActive)!;
        for (const workspace of removedMonitor.workspaces) {
          for (const container of workspace.containers) {
            activeWs.containers.push({
              ...container,
              position: clampPosition(container.position, container.size, primary.bounds),
            });
          }
        }
      }

      eventBus.emit('monitor:changed', { added: added.length, removed: removed.length });
      eventBus.emit('layout:changed');

      return {
        monitors,
        index: buildWindowIndex(monitors),
      };
    });
  },

  setMonitors: (monitors) =>
    set({
      monitors,
      index: buildWindowIndex(monitors),
    }),

  arrangeWindows: () => {
    set((state) => {
      const monitors = state.monitors.map((monitor) => {
        const workspaces = monitor.workspaces.map((workspace) => {
          if (!workspace.isActive) return workspace;

          const visible = workspace.containers.filter((c) => !c.windows.every((w) => w.isMinimized));
          if (visible.length === 0) return workspace;

          const cols = Math.min(4, Math.ceil(Math.sqrt(visible.length)));
          const rows = Math.ceil(visible.length / cols);
          const cellW = Math.floor(monitor.bounds.width / cols);
          const cellH = Math.floor((monitor.bounds.height - 36) / rows);

          const containers = workspace.containers.map((container) => {
            const idx = visible.findIndex((c) => c.id === container.id);
            if (idx === -1) return container;

            const col = idx % cols;
            const row = Math.floor(idx / cols);

            return {
              ...container,
              position: { x: col * cellW, y: row * cellH },
              size: { width: cellW, height: cellH },
              snapRegion: null,
            };
          });

          return { ...workspace, containers };
        });

        return { ...monitor, workspaces };
      });

      eventBus.emit('layout:changed');

      return { monitors, index: buildWindowIndex(monitors) };
    });
  },

  closeAllWindows: () => {
    set((state) => {
      const monitors = state.monitors.map((monitor) => ({
        ...monitor,
        workspaces: monitor.workspaces.map((workspace) => ({
          ...workspace,
          containers: [],
        })),
      }));

      eventBus.emit('layout:changed');

      return {
        monitors,
        index: new Map(),
      };
    });
  },

  blurAllWindows: () => {
    set((state) => {
      const monitors = state.monitors.map((monitor) => ({
        ...monitor,
        workspaces: monitor.workspaces.map((workspace) => ({
          ...workspace,
          containers: workspace.containers.map((container) => ({
            ...container,
            windows: container.windows.map((w) => ({ ...w, isFocused: false })),
          })),
        })),
      }));

      return { monitors, index: state.index };
    });
  },

  toggleMinimizeWindow: (windowId) => {
    set((state) => {
      const path = state.index.get(windowId);
      if (!path) return state;

      const monitors = state.monitors.map((monitor) => {
        if (monitor.id !== path.monitorId) return monitor;

        const workspaces = monitor.workspaces.map((workspace) => {
          if (workspace.id !== path.workspaceId) return workspace;

          const containers = workspace.containers.map((container) => {
            if (container.id !== path.containerId) return container;

            return {
              ...container,
              windows: container.windows.map((w) =>
                w.id === windowId ? { ...w, isMinimized: !w.isMinimized } : w
              ),
            };
          });

          return { ...workspace, containers };
        });

        return { ...monitor, workspaces };
      });

      return { monitors, index: buildWindowIndex(monitors) };
    });
  },

  renameWindow: (windowId, title) => {
    set((state) => {
      const path = state.index.get(windowId);
      if (!path) return state;

      const monitors = state.monitors.map((monitor) => {
        if (monitor.id !== path.monitorId) return monitor;

        const workspaces = monitor.workspaces.map((workspace) => {
          if (workspace.id !== path.workspaceId) return workspace;

          const containers = workspace.containers.map((container) => {
            if (container.id !== path.containerId) return container;

            return {
              ...container,
              windows: container.windows.map((w) =>
                w.id === windowId ? { ...w, title } : w
              ),
            };
          });

          return { ...workspace, containers };
        });

        return { ...monitor, workspaces };
      });

      return { monitors, index: buildWindowIndex(monitors) };
    });
  },
}));
