import { create } from 'zustand';
import type {
  Plugin,
  PluginManifest,
  PluginConfig,
  PluginRegistryEntry,
  PipelinePacket,
  PipelinePort,
  PluginEvent,
} from './types';

// ---------------------------------------------------------------------------
// Pipeline implementation
// ---------------------------------------------------------------------------

class PipelineBus {
  private subscribers = new Map<string, Set<(packet: PipelinePacket) => void>>();
  private connections = new Map<string, string>(); // sourceId -> targetId
  private buffers = new Map<string, PipelinePacket[]>();

  connect(sourceId: string, targetId: string) {
    this.connections.set(sourceId, targetId);
    this.emit({ type: 'pipeline:connected', sourceId, targetId } as PluginEvent);
  }

  disconnect(sourceId: string) {
    const targetId = this.connections.get(sourceId);
    if (targetId) {
      this.connections.delete(sourceId);
      this.emit({ type: 'pipeline:disconnected', sourceId, targetId } as PluginEvent);
    }
  }

  subscribe(sourceId: string, callback: (packet: PipelinePacket) => void) {
    if (!this.subscribers.has(sourceId)) {
      this.subscribers.set(sourceId, new Set());
    }
    this.subscribers.get(sourceId)!.add(callback);
    return () => {
      this.subscribers.get(sourceId)?.delete(callback);
    };
  }

  write(sourceId: string, packet: Omit<PipelinePacket, 'id' | 'timestamp'>) {
    const fullPacket: PipelinePacket = {
      ...packet,
      id: `pkt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };

    // Direct target delivery
    const targetId = this.connections.get(sourceId);
    if (targetId) {
      this.subscribers.get(targetId)?.forEach((cb) => cb(fullPacket));
    }

    // Always notify source subscribers too (for echo/monitoring)
    this.subscribers.get(sourceId)?.forEach((cb) => cb(fullPacket));

    // Store in buffer for later read
    if (!this.buffers.has(sourceId)) {
      this.buffers.set(sourceId, []);
    }
    this.buffers.get(sourceId)!.push(fullPacket);

    this.emit({ type: 'pipeline:data', packet: fullPacket } as PluginEvent);
  }

  read(sourceId: string): PipelinePacket | null {
    const buffer = this.buffers.get(sourceId);
    if (!buffer || buffer.length === 0) return null;
    return buffer.shift() ?? null;
  }

  isConnected(sourceId: string): boolean {
    return this.connections.has(sourceId);
  }

  getTargetId(sourceId: string): string | null {
    return this.connections.get(sourceId) ?? null;
  }

  // Simple event bus for plugin system events
  private eventSubscribers = new Set<(event: PluginEvent) => void>();

  onEvent(callback: (event: PluginEvent) => void) {
    this.eventSubscribers.add(callback);
    return () => this.eventSubscribers.delete(callback);
  }

  private emit(event: PluginEvent) {
    this.eventSubscribers.forEach((cb) => cb(event));
  }
}

export const pipelineBus = new PipelineBus();

// ---------------------------------------------------------------------------
// Plugin Store
// ---------------------------------------------------------------------------

interface PluginStore {
  /** All registered plugins */
  plugins: Map<string, PluginRegistryEntry>;
  /** Pipeline bus instance */
  pipelineBus: PipelineBus;

  // Actions
  registerPlugin: (plugin: Plugin) => void;
  unregisterPlugin: (pluginId: string) => void;
  updatePluginConfig: (pluginId: string, config: Partial<PluginConfig>) => void;
  getPlugin: (pluginId: string) => PluginRegistryEntry | undefined;
  getEnabledPlugins: () => PluginRegistryEntry[];
  getPluginManifests: () => PluginManifest[];

  // Pipeline actions
  connectPipeline: (sourceId: string, targetId: string) => void;
  disconnectPipeline: (sourceId: string) => void;
  createPipelinePort: (windowId: string) => PipelinePort;

  // Events
  onEvent: (callback: (event: PluginEvent) => void) => () => void;
}

const createDefaultConfig = (): PluginConfig => ({
  enabled: true,
  settings: {},
});

const createPipelinePort = (windowId: string): PipelinePort => ({
  read: () => pipelineBus.read(windowId),
  write: (packet) => pipelineBus.write(windowId, packet),
  subscribe: (callback) => pipelineBus.subscribe(windowId, callback),
  isConnected: () => pipelineBus.isConnected(windowId),
  getTargetId: () => pipelineBus.getTargetId(windowId),
});

export const usePluginStore = create<PluginStore>((set, get) => ({
  plugins: new Map(),
  pipelineBus,

  registerPlugin: (plugin) => {
    const entry: PluginRegistryEntry = {
      ...plugin,
      config: { ...createDefaultConfig(), ...(plugin.manifest.id === 'vio-opencli-terminal' ? { settings: { opencliPath: 'opencli' } } : {}) },
      registeredAt: Date.now(),
    };

    set((state) => {
      const newPlugins = new Map(state.plugins);
      newPlugins.set(plugin.manifest.id, entry);
      return { plugins: newPlugins };
    });

    plugin.initialize?.().catch(console.error);
  },

  unregisterPlugin: (pluginId) => {
    const plugin = get().plugins.get(pluginId);
    if (plugin) {
      plugin.cleanup?.().catch(console.error);
      set((state) => {
        const newPlugins = new Map(state.plugins);
        newPlugins.delete(pluginId);
        return { plugins: newPlugins };
      });
    }
  },

  updatePluginConfig: (pluginId, configUpdate) => {
    set((state) => {
      const plugin = state.plugins.get(pluginId);
      if (!plugin) return state;

      const newConfig: PluginConfig = {
        ...plugin.config,
        ...configUpdate,
        settings: { ...plugin.config.settings, ...configUpdate.settings },
      };

      const newPlugins = new Map(state.plugins);
      newPlugins.set(pluginId, { ...plugin, config: newConfig });
      return { plugins: newPlugins };
    });
  },

  getPlugin: (pluginId) => get().plugins.get(pluginId),

  getEnabledPlugins: () =>
    Array.from(get().plugins.values()).filter((p) => p.config.enabled),

  getPluginManifests: () =>
    Array.from(get().plugins.values()).map((p) => p.manifest),

  connectPipeline: (sourceId, targetId) => {
    pipelineBus.connect(sourceId, targetId);
  },

  disconnectPipeline: (sourceId) => {
    pipelineBus.disconnect(sourceId);
  },

  createPipelinePort: (windowId) => createPipelinePort(windowId),

  onEvent: (callback) => pipelineBus.onEvent(callback),
}));
