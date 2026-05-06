// src/lib/index.ts

import type { Monitor, WindowPath } from '../core/types';

/**
 * Build O(1) lookup Map from windowId → { monitorId, workspaceId, containerId }
 * Call this after every structural mutation (window created/closed, container moved, etc.)
 */
export function buildWindowIndex(monitors: Monitor[]): Map<string, WindowPath> {
  const index = new Map<string, WindowPath>();

  for (const monitor of monitors) {
    for (const workspace of monitor.workspaces) {
      for (const container of workspace.containers) {
        for (const window of container.windows) {
          index.set(window.id, {
            monitorId: monitor.id,
            workspaceId: workspace.id,
            containerId: container.id,
          });
        }
      }
    }
  }

  return index;
}

/**
 * Find a container by ID across all monitors/workspaces
 */
export function findContainer(monitors: Monitor[], containerId: string) {
  for (const monitor of monitors) {
    for (const workspace of monitor.workspaces) {
      const container = workspace.containers.find((c) => c.id === containerId);
      if (container) return { monitor, workspace, container };
    }
  }
  return null;
}

/**
 * Find a window by ID across all layers
 */
export function findWindow(monitors: Monitor[], windowId: string) {
  for (const monitor of monitors) {
    for (const workspace of monitor.workspaces) {
      for (const container of workspace.containers) {
        const window = container.windows.find((w) => w.id === windowId);
        if (window) return { monitor, workspace, container, window };
      }
    }
  }
  return null;
}
