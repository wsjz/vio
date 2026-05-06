// src/hooks/useKeyboard.ts
// Global keyboard shortcuts — uses getState() to avoid re-renders on store changes

import { useEffect, useRef } from 'react';
import { useVioStore } from '../core/stores/vioStore';
import { useUiStore } from '../core/stores/uiStore';
import { usePlatformStore } from '../core/platform/platformStore';
import { matchesShortcut, SHORTCUTS } from '../core/platform/shortcuts';
import type { TerminalType } from '../core/types';

const QUICK_LAUNCH: TerminalType[] = [
  'system-monitor',
  'shell',
  'file-manager',
  'network-map',
  'code-editor',
  'map',
  'media-player',
  'viewer-3d',
];

export function useKeyboard() {
  // Only subscribe to UI state that controls overlay visibility
  const launcherVisible = useUiStore((s) => s.launcherVisible);
  const appGridVisible = useUiStore((s) => s.appGridVisible);
  const toggleLauncher = useUiStore((s) => s.toggleLauncher);
  const setLauncherVisible = useUiStore((s) => s.setLauncherVisible);
  const setAppGridVisible = useUiStore((s) => s.setAppGridVisible);

  // Track UI state in refs so the key handler always has latest values
  // without re-registering the document listener
  const launcherVisibleRef = useRef(launcherVisible);
  const appGridVisibleRef = useRef(appGridVisible);
  launcherVisibleRef.current = launcherVisible;
  appGridVisibleRef.current = appGridVisible;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const launcherOpen = launcherVisibleRef.current;
      const appGridOpen = appGridVisibleRef.current;

      // AppGrid escape
      if (appGridOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setAppGridVisible(false);
        }
        return;
      }

      // Launcher toggle (Cmd/Ctrl + T)
      if (matchesShortcut(e, SHORTCUTS.launcher.key, SHORTCUTS.launcher.modifiers)) {
        e.preventDefault();
        toggleLauncher();
        return;
      }

      // AppGrid toggle (Cmd/Ctrl + Up)
      if (matchesShortcut(e, SHORTCUTS.appGrid.key, SHORTCUTS.appGrid.modifiers)) {
        e.preventDefault();
        setAppGridVisible(true);
        return;
      }

      // Escape closes launcher
      if (e.key === 'Escape' && launcherOpen) {
        e.preventDefault();
        setLauncherVisible(false);
        return;
      }

      // Quick launch from launcher — number keys WITHOUT modifier
      if (launcherOpen) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= QUICK_LAUNCH.length) {
          e.preventDefault();
          useVioStore.getState().createWindow(QUICK_LAUNCH[num - 1]);
          setLauncherVisible(false);
        }
        return;
      }

      // All shortcuts below require a modifier
      if (!isMod) return;

      // Read fresh vioStore state for window-related shortcuts
      const monitors = useVioStore.getState().monitors;
      const activeMonitor = monitors.find((m) => m.isPrimary) || monitors[0];
      if (!activeMonitor) return;

      const activeWorkspace = activeMonitor.workspaces.find((w) => w.isActive);
      if (!activeWorkspace) return;

      const focusedContainer = activeWorkspace.containers
        .slice()
        .sort((a, b) => b.zIndex - a.zIndex)
        .find((c) => c.windows.some((w) => w.isFocused));

      const focusedWindow = focusedContainer?.windows.find((w) => w.isFocused);

      // Close focused window (Cmd/Ctrl + W)
      if (matchesShortcut(e, SHORTCUTS.closeWindow.key, SHORTCUTS.closeWindow.modifiers)) {
        e.preventDefault();
        if (focusedWindow) useVioStore.getState().closeWindow(focusedWindow.id);
        return;
      }

      // Minimize focused window (Cmd/Ctrl + M, no shift)
      if (matchesShortcut(e, SHORTCUTS.minimizeWindow.key, SHORTCUTS.minimizeWindow.modifiers) && !e.shiftKey) {
        e.preventDefault();
        if (focusedWindow) useVioStore.getState().toggleMinimizeWindow(focusedWindow.id);
        return;
      }

      // Cycle windows forward (Cmd/Ctrl + Tab)
      if (matchesShortcut(e, SHORTCUTS.cycleWindows.key, SHORTCUTS.cycleWindows.modifiers) && !e.shiftKey) {
        e.preventDefault();
        const visible = activeWorkspace.containers.filter((c) =>
          c.windows.some((w) => !w.isMinimized)
        );
        if (visible.length === 0) return;
        const idx = visible.findIndex((c) => c.id === focusedContainer?.id);
        const next = visible[(idx + 1) % visible.length];
        useVioStore.getState().focusWindow(next.activeWindowId);
        return;
      }

      // Cycle windows backward (Cmd/Ctrl + Shift + Tab)
      if (matchesShortcut(e, SHORTCUTS.cycleWindowsReverse.key, SHORTCUTS.cycleWindowsReverse.modifiers)) {
        e.preventDefault();
        const visible = activeWorkspace.containers.filter((c) =>
          c.windows.some((w) => !w.isMinimized)
        );
        if (visible.length === 0) return;
        const idx = visible.findIndex((c) => c.id === focusedContainer?.id);
        const prev = visible[(idx - 1 + visible.length) % visible.length];
        useVioStore.getState().focusWindow(prev.activeWindowId);
        return;
      }

      // Arrange windows (Cmd/Ctrl + Shift + A)
      if (matchesShortcut(e, SHORTCUTS.arrangeWindows.key, SHORTCUTS.arrangeWindows.modifiers)) {
        e.preventDefault();
        useVioStore.getState().arrangeWindows();
        return;
      }

      // Switch workspace left (Cmd/Ctrl + Left)
      if (matchesShortcut(e, SHORTCUTS.prevWorkspace.key, SHORTCUTS.prevWorkspace.modifiers) && !e.shiftKey) {
        e.preventDefault();
        const currentIdx = activeMonitor.workspaces.findIndex((w) => w.isActive);
        const prevIdx = (currentIdx - 1 + activeMonitor.workspaces.length) % activeMonitor.workspaces.length;
        useVioStore.getState().switchWorkspace(activeMonitor.id, activeMonitor.workspaces[prevIdx].id);
        return;
      }

      // Switch workspace right (Cmd/Ctrl + Right)
      if (matchesShortcut(e, SHORTCUTS.nextWorkspace.key, SHORTCUTS.nextWorkspace.modifiers) && !e.shiftKey) {
        e.preventDefault();
        const currentIdx = activeMonitor.workspaces.findIndex((w) => w.isActive);
        const nextIdx = (currentIdx + 1) % activeMonitor.workspaces.length;
        useVioStore.getState().switchWorkspace(activeMonitor.id, activeMonitor.workspaces[nextIdx].id);
        return;
      }

      // Move container to prev workspace (Cmd/Ctrl + Shift + Left)
      if (matchesShortcut(e, SHORTCUTS.moveContainerToPrevWorkspace.key, SHORTCUTS.moveContainerToPrevWorkspace.modifiers)) {
        e.preventDefault();
        if (focusedContainer) {
          const currentIdx = activeMonitor.workspaces.findIndex((w) => w.isActive);
          const prevIdx = (currentIdx - 1 + activeMonitor.workspaces.length) % activeMonitor.workspaces.length;
          useVioStore.getState().moveContainerToWorkspace(focusedContainer.id, activeMonitor.workspaces[prevIdx].id);
        }
        return;
      }

      // Move container to next workspace (Cmd/Ctrl + Shift + Right)
      if (matchesShortcut(e, SHORTCUTS.moveContainerToNextWorkspace.key, SHORTCUTS.moveContainerToNextWorkspace.modifiers)) {
        e.preventDefault();
        if (focusedContainer) {
          const currentIdx = activeMonitor.workspaces.findIndex((w) => w.isActive);
          const nextIdx = (currentIdx + 1) % activeMonitor.workspaces.length;
          useVioStore.getState().moveContainerToWorkspace(focusedContainer.id, activeMonitor.workspaces[nextIdx].id);
        }
        return;
      }

      // Quick launch terminals via modifier + 1~9 (when launcher is NOT open)
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= QUICK_LAUNCH.length) {
        e.preventDefault();
        useVioStore.getState().createWindow(QUICK_LAUNCH[num - 1]);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleLauncher, setLauncherVisible, setAppGridVisible]);
}
