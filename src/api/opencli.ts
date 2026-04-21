import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

export interface OpenCLIStatus {
  installed: boolean;
  version: string | null;
  path: string | null;
  npm_available: boolean;
}

export interface InstallResult {
  success: boolean;
  message: string;
  version: string | null;
}

/**
 * Check if OpenCLI is installed and get its status
 */
export async function checkOpenCLI(): Promise<OpenCLIStatus> {
  return invoke('check_opencli');
}

/**
 * Install OpenCLI globally via npm
 */
export async function installOpenCLI(): Promise<InstallResult> {
  return invoke('install_opencli');
}

/**
 * Pick OpenCLI binary path using file dialog
 */
export async function pickOpenCLIPath(): Promise<string | null> {
  const file = await open({
    multiple: false,
    directory: false,
    filters: [
      { name: 'Executable', extensions: [''] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return file || null;
}

/**
 * Open file dialog to select opencli binary (backend version)
 */
export async function pickOpenCLIPathBackend(): Promise<string | null> {
  return invoke('pick_opencli_path');
}
