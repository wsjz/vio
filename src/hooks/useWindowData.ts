// src/hooks/useWindowData.ts

import { useShallow } from 'zustand/react/shallow';
import { useVioStore } from '../core/stores/vioStore';
import type { Window, Container, Workspace, Monitor } from '../core/types';

export interface WindowData {
  window: Window;
  container: Container;
  workspace: Workspace;
  monitor: Monitor;
}

export function useWindowData(windowId: string): WindowData | null {
  return useVioStore(
    useShallow((state) => {
      const path = state.index.get(windowId);
      if (!path) return null;

      const monitor = state.monitors.find((m) => m.id === path.monitorId);
      if (!monitor) return null;

      const workspace = monitor.workspaces.find((w) => w.id === path.workspaceId);
      if (!workspace) return null;

      const container = workspace.containers.find((c) => c.id === path.containerId);
      if (!container) return null;

      const window = container.windows.find((w) => w.id === windowId);
      if (!window) return null;

      return { window, container, workspace, monitor };
    })
  );
}

export function useActiveWorkspaceWindows(monitorId?: string) {
  return useVioStore(
    useShallow((state) => {
      const monitor = monitorId
        ? state.monitors.find((m) => m.id === monitorId)
        : state.monitors.find((m) => m.isPrimary) || state.monitors[0];

      if (!monitor) return [];

      const activeWorkspace = monitor.workspaces.find((w) => w.isActive);
      if (!activeWorkspace) return [];

      return activeWorkspace.containers.filter(
        (c) => !c.windows.every((w) => w.isMinimized)
      );
    })
  );
}
