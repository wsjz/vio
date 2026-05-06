// src/core/persistence/layoutPersistence.ts

import type { Monitor } from '../types';

const LAYOUT_FILENAME = 'workspace-layout.json';

export interface SerializedLayout {
  version: 1;
  timestamp: number;
  monitors: Monitor[];
}

export async function saveWorkspaceLayout(monitors: Monitor[]): Promise<void> {
  const IS_TAURI = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;
  if (!IS_TAURI) {
    localStorage.setItem(LAYOUT_FILENAME, JSON.stringify({ version: 1, timestamp: Date.now(), monitors }));
    return;
  }

  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('save_workspace_layout', {
    data: JSON.stringify({ version: 1, timestamp: Date.now(), monitors }),
  });
}

export async function loadWorkspaceLayout(): Promise<Monitor[] | null> {
  const IS_TAURI = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;
  if (!IS_TAURI) {
    const raw = localStorage.getItem(LAYOUT_FILENAME);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as SerializedLayout;
      return parsed.monitors;
    } catch {
      return null;
    }
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const raw = await invoke<string>('load_workspace_layout');
    const parsed = JSON.parse(raw) as SerializedLayout;
    return parsed.monitors;
  } catch {
    return null;
  }
}

export function migrateMonitors(saved: Monitor[], current: { id: string; bounds: { x: number; y: number; width: number; height: number }; dpi: number; isPrimary: boolean }[]): Monitor[] {
  const currentIds = new Set(current.map((m) => m.id));
  const primary = current.find((m) => m.isPrimary) || current[0];

  if (!primary) return current as Monitor[];

  const result: Monitor[] = current.map((monitor) => ({
    ...monitor,
    workspaces: [
      {
        id: `ws-${monitor.id}-0`,
        index: 0,
        name: 'Alpha',
        isActive: true,
        containers: [],
      },
      {
        id: `ws-${monitor.id}-1`,
        index: 1,
        name: 'Beta',
        isActive: false,
        containers: [],
      },
      {
        id: `ws-${monitor.id}-2`,
        index: 2,
        name: 'Gamma',
        isActive: false,
        containers: [],
      },
    ],
  }));

  for (const savedMonitor of saved) {
    const targetMonitor = result.find((m) => m.id === savedMonitor.id);

    for (const savedWorkspace of savedMonitor.workspaces) {
      if (targetMonitor) {
        const targetWorkspace = targetMonitor.workspaces[savedWorkspace.index];
        if (targetWorkspace) {
          targetWorkspace.containers.push(
            ...savedWorkspace.containers.map((c) => ({
              ...c,
              position: clampToBounds(c.position, c.size, targetMonitor.bounds),
            }))
          );
        } else {
          const activeWs = targetMonitor.workspaces.find((w) => w.isActive)!;
          activeWs.containers.push(
            ...savedWorkspace.containers.map((c) => ({
              ...c,
              position: clampToBounds(c.position, c.size, targetMonitor.bounds),
            }))
          );
        }
      } else {
        const activeWs = result[0].workspaces.find((w) => w.isActive)!;
        activeWs.containers.push(
          ...savedWorkspace.containers.map((c) => ({
            ...c,
            position: clampToBounds(c.position, c.size, result[0].bounds),
          }))
        );
      }
    }
  }

  return result;
}

function clampToBounds(
  position: { x: number; y: number },
  size: { width: number; height: number },
  bounds: { width: number; height: number }
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(position.x, bounds.width - Math.min(size.width, bounds.width))),
    y: Math.max(0, Math.min(position.y, bounds.height - Math.min(size.height, bounds.height))),
  };
}
