// src/api/platform.ts

import { invoke } from '@tauri-apps/api/core';

export async function getPlatform(): Promise<string> {
  return invoke('get_platform');
}
