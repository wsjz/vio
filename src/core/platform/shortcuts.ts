import { usePlatformStore } from './platformStore';

export function getMetaKeyLabel(): string {
  const { isMac } = usePlatformStore.getState();
  return isMac ? 'Cmd' : 'Ctrl';
}

export function matchesShortcut(
  e: KeyboardEvent,
  key: string,
  modifiers: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }
): boolean {
  const { isMac } = usePlatformStore.getState();

  const keyMatch = e.key.toLowerCase() === key.toLowerCase();

  // On macOS: Cmd (meta) is primary, Ctrl is secondary
  // On Windows/Linux: Ctrl is primary, we treat "meta" modifier as "ctrl"
  const effectiveMeta = isMac ? e.metaKey : e.ctrlKey;
  const effectiveCtrl = isMac ? e.ctrlKey : e.metaKey;

  const ctrlMatch = modifiers.ctrl === undefined || effectiveCtrl === modifiers.ctrl;
  const metaMatch = modifiers.meta === undefined || effectiveMeta === modifiers.meta;
  const shiftMatch = modifiers.shift === undefined || e.shiftKey === modifiers.shift;
  const altMatch = modifiers.alt === undefined || e.altKey === modifiers.alt;

  if (isMac) {
    const hasModifier = e.metaKey || e.ctrlKey;
    if (modifiers.meta && !e.metaKey && !e.ctrlKey) return false;
    return keyMatch && hasModifier && shiftMatch && altMatch;
  }

  return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;
}

export const SHORTCUTS = {
  launcher: { key: 't', modifiers: { meta: true } as const },
  closeWindow: { key: 'w', modifiers: { meta: true } as const },
  minimizeWindow: { key: 'm', modifiers: { meta: true } as const },
  maximizeWindow: { key: 'm', modifiers: { meta: true, shift: true } as const },
  cycleWindows: { key: 'tab', modifiers: { meta: true } as const },
  cycleWindowsReverse: { key: 'tab', modifiers: { meta: true, shift: true } as const },
  arrangeWindows: { key: 'a', modifiers: { meta: true, shift: true } as const },
  appGrid: { key: 'arrowup', modifiers: { meta: true } as const },
  prevWorkspace: { key: 'arrowleft', modifiers: { meta: true } as const },
  nextWorkspace: { key: 'arrowright', modifiers: { meta: true } as const },
  moveContainerToPrevWorkspace: { key: 'arrowleft', modifiers: { meta: true, shift: true } as const },
  moveContainerToNextWorkspace: { key: 'arrowright', modifiers: { meta: true, shift: true } as const },
} as const;
