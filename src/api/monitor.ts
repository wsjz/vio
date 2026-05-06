// src/api/monitor.ts

import { invoke } from '@tauri-apps/api/core';

export interface MonitorInfo {
  id: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dpi: number;
  is_primary: boolean;
}

export async function getMonitors(): Promise<MonitorInfo[]> {
  return invoke('get_monitors');
}
