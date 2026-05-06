import { create } from 'zustand';

export type Platform = 'macos' | 'windows' | 'linux' | 'unknown';

interface PlatformState {
  platform: Platform;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  setPlatform: (platform: Platform) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  platform: 'unknown',
  isMac: false,
  isWindows: false,
  isLinux: false,
  setPlatform: (platform) =>
    set({
      platform,
      isMac: platform === 'macos',
      isWindows: platform === 'windows',
      isLinux: platform === 'linux',
    }),
}));
