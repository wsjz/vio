/**
 * Vio Plugin System - Core Types
 * 
 * Plugins are self-contained terminal components that can be dynamically
 * registered and rendered within the Vio desktop environment.
 */

import type { ComponentType } from 'react';
import type { TerminalConfig, Size2D } from '../../types';

/** Plugin manifest - describes the plugin metadata */
export interface PluginManifest {
  /** Unique plugin identifier (e.g., 'vio-opencli-terminal') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Plugin description */
  description: string;
  /** Plugin version (semver) */
  version: string;
  /** Plugin author */
  author?: string;
  /** Plugin category */
  category: 'terminal' | 'widget' | 'tool' | 'integration';
  /** Icon character or emoji */
  icon: string;
  /** Whether this plugin requires backend commands */
  requiresBackend: boolean;
  /** Default window size */
  defaultSize: Size2D;
  /** Minimum window size */
  minSize: Size2D;
}

/** Plugin configuration schema */
export interface PluginConfig {
  /** Whether the plugin is enabled */
  enabled: boolean;
  /** Plugin-specific settings */
  settings: Record<string, unknown>;
  /** Custom styling overrides */
  styles?: Record<string, string>;
}

/** Pipeline data packet - for terminal-to-terminal data flow */
export interface PipelinePacket {
  /** Unique packet ID */
  id: string;
  /** Source terminal/window ID */
  sourceId: string;
  /** Data type identifier */
  type: 'text' | 'json' | 'csv' | 'html' | 'binary';
  /** The actual payload */
  data: unknown;
  /** Timestamp */
  timestamp: number;
  /** Optional metadata */
  meta?: Record<string, unknown>;
}

/** Pipeline interface for inter-terminal communication */
export interface PipelinePort {
  /** Read data from pipeline (non-blocking) */
  read: () => PipelinePacket | null;
  /** Write data to pipeline */
  write: (packet: Omit<PipelinePacket, 'id' | 'timestamp'>) => void;
  /** Subscribe to incoming data */
  subscribe: (callback: (packet: PipelinePacket) => void) => () => void;
  /** Check if pipeline is connected to a target */
  isConnected: () => boolean;
  /** Get connected target ID */
  getTargetId: () => string | null;
}

/** Context provided to plugin components */
export interface PluginContext {
  /** Plugin configuration */
  config: PluginConfig;
  /** Update plugin configuration */
  updateConfig: (config: Partial<PluginConfig>) => void;
  /** Pipeline for data flow */
  pipeline: PipelinePort;
  /** Send data to another terminal by ID */
  sendToTerminal: (targetId: string, data: unknown, type?: PipelinePacket['type']) => void;
  /** Open a new terminal with data */
  openTerminal: (type: string, initialData?: unknown) => void;
  /** Current window ID */
  windowId: string;
  /** Terminal-specific config */
  terminalConfig: TerminalConfig;
}

/** Plugin component props */
export interface PluginComponentProps {
  context: PluginContext;
}

/** Plugin definition - the complete plugin structure */
export interface Plugin {
  manifest: PluginManifest;
  /** The React component to render */
  component: ComponentType<PluginComponentProps>;
  /** Optional: Initialize plugin (called on registration) */
  initialize?: () => Promise<void>;
  /** Optional: Cleanup plugin (called on unregistration) */
  cleanup?: () => Promise<void>;
  /** Optional: Handle incoming pipeline data */
  onPipelineData?: (packet: PipelinePacket) => void;
}

/** Plugin registry entry */
export interface PluginRegistryEntry extends Plugin {
  /** Current configuration */
  config: PluginConfig;
  /** Registration timestamp */
  registeredAt: number;
}

/** Plugin system events */
export type PluginEvent =
  | { type: 'plugin:registered'; pluginId: string }
  | { type: 'plugin:unregistered'; pluginId: string }
  | { type: 'plugin:configChanged'; pluginId: string; config: PluginConfig }
  | { type: 'pipeline:data'; packet: PipelinePacket }
  | { type: 'pipeline:connected'; sourceId: string; targetId: string }
  | { type: 'pipeline:disconnected'; sourceId: string; targetId: string };
