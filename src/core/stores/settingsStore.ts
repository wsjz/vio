// src/core/stores/settingsStore.ts

import { create } from 'zustand';

interface Keybinding {
  key: string;
  modifiers: ('ctrl' | 'meta' | 'shift' | 'alt')[];
  action: string;
}

interface SettingsState {
  autostart: boolean;
  setAutostart: (enabled: boolean) => void;

  showTrayIcon: boolean;
  setShowTrayIcon: (enabled: boolean) => void;

  keybindings: Keybinding[];
  setKeybinding: (action: string, keybinding: Keybinding) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  autostart: false,
  setAutostart: (enabled) => set({ autostart: enabled }),

  showTrayIcon: true,
  setShowTrayIcon: (enabled) => set({ showTrayIcon: enabled }),

  keybindings: [],
  setKeybinding: (action, keybinding) =>
    set((state) => ({
      keybindings: [
        ...state.keybindings.filter((k) => k.action !== action),
        keybinding,
      ],
    })),
}));
