import type { WindowState } from '../../types';
import { SystemMonitor } from '../../terminals/system-monitor/SystemMonitor';
import { ShellTerminal } from '../../terminals/shell/ShellTerminal';
import { FileManager } from '../../terminals/file-manager/FileManager';
import { NetworkMap } from '../../terminals/network-map/NetworkMap';
import { Settings } from '../../terminals/settings/Settings';
import { ClockWidget } from '../../terminals/widgets/clock/ClockWidget';
import { CodeEditor } from '../../terminals/code-editor/CodeEditor';
import { MediaPlayer } from '../../terminals/media-player/MediaPlayer';
import { Viewer3D } from '../../terminals/viewer-3d/Viewer3D';
import { MapViewer } from '../../terminals/map/MapViewer';
import { LogViewer } from '../../terminals/log-viewer/LogViewer';
import { OpenCLITerminal } from '../../terminals/opencli/OpenCLITerminal';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { usePluginStore, type PluginContext } from '../../core/plugin-system';
import { useWindowStore } from '../../core/window-manager/windowStore';
import { useMemo } from 'react';

interface WindowContentProps {
  window: WindowState;
}

function TerminalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

export function WindowContent({ window }: WindowContentProps) {
  const { theme } = useThemeStore();
  const { getPlugin, createPipelinePort } = usePluginStore();
  const { createWindow } = useWindowStore();

  // Create plugin context for this window
  const pluginContext = useMemo((): PluginContext | undefined => {
    const plugin = getPlugin(window.type);
    if (!plugin) return undefined;

    return {
      config: plugin.config,
      updateConfig: (config) => {
        usePluginStore.getState().updatePluginConfig(window.type, config);
      },
      pipeline: createPipelinePort(window.id),
      sendToTerminal: (targetId, data, type = 'text') => {
        const targetPipeline = createPipelinePort(targetId);
        targetPipeline.write({
          sourceId: window.id,
          type,
          data,
        });
      },
      openTerminal: (type, initialData) => {
        // Create new window and optionally send initial data
        createWindow(type as string);
        if (initialData !== undefined) {
          // Small delay to allow window creation
          setTimeout(() => {
            const windows = usePluginStore.getState().getEnabledPlugins();
            // Find the newly created window (last one)
          }, 100);
        }
      },
      windowId: window.id,
      terminalConfig: window.config,
    };
  }, [window.id, window.type, window.config, getPlugin, createPipelinePort, createWindow]);

  // Check if this is a plugin terminal
  const plugin = getPlugin(window.type);
  if (plugin) {
    const PluginComponent = plugin.component;
    return (
      <TerminalWrapper>
        <PluginComponent context={pluginContext!} />
      </TerminalWrapper>
    );
  }

  // Built-in terminals
  switch (window.type) {
    case 'system-monitor':
      return <TerminalWrapper><SystemMonitor /></TerminalWrapper>;
    case 'shell':
      return <TerminalWrapper><ShellTerminal isFocused={window.isFocused} /></TerminalWrapper>;
    case 'log-viewer':
      return <TerminalWrapper><LogViewer /></TerminalWrapper>;
    case 'file-manager':
      return <TerminalWrapper><FileManager /></TerminalWrapper>;
    case 'network-map':
      return <TerminalWrapper><NetworkMap /></TerminalWrapper>;
    case 'settings':
      return <TerminalWrapper><Settings /></TerminalWrapper>;
    case 'widget-clock':
      return <TerminalWrapper><ClockWidget /></TerminalWrapper>;
    case 'media-player':
      return <TerminalWrapper><MediaPlayer /></TerminalWrapper>;
    case 'viewer-3d':
      return <TerminalWrapper><Viewer3D /></TerminalWrapper>;
    case 'map':
      return <TerminalWrapper><MapViewer /></TerminalWrapper>;
    case 'code-editor':
      return <TerminalWrapper><CodeEditor /></TerminalWrapper>;
    case 'opencli':
      return <TerminalWrapper><OpenCLITerminal isFocused={window.isFocused} /></TerminalWrapper>;
    default:
      return (
        <div style={{ fontSize: 12, color: theme.colors.textSecondary, fontFamily: theme.font.mono }}>
          <p>Terminal: {window.type}</p>
          <p style={{ marginTop: 8, color: theme.colors.textTertiary }}>Content will be rendered here...</p>
        </div>
      );
  }
}
