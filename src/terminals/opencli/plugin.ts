/**
 * OpenCLI Terminal Plugin Registration
 * 
 * This file registers the OpenCLI terminal as a Vio plugin.
 * It can be imported and registered during app initialization.
 */

import type { Plugin, PluginManifest } from '../../core/plugin-system';
import { OpenCLITerminal } from './OpenCLITerminal';

export const openCLIManifest: PluginManifest = {
  id: 'vio-opencli-terminal',
  name: 'OpenCLI Terminal',
  description: 'Access 90+ website adapters and browser automation through OpenCLI',
  version: '1.0.0',
  author: 'Vio',
  category: 'terminal',
  icon: '⌘',
  requiresBackend: true,
  defaultSize: { width: 600, height: 450 },
  minSize: { width: 400, height: 300 },
};

export const openCLIPlugin: Plugin = {
  manifest: openCLIManifest,
  component: OpenCLITerminal,
  initialize: async () => {
    console.log('[OpenCLI Plugin] Initialized');
  },
  cleanup: async () => {
    console.log('[OpenCLI Plugin] Cleaned up');
  },
};

// Export a function to register the plugin
export function registerOpenCLIPlugin(register: (plugin: Plugin) => void) {
  register(openCLIPlugin);
}
