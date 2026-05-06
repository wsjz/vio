import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { WindowFrame } from '../window/WindowFrame';
import { TaskBar } from './TaskBar';
import { Launcher } from './Launcher';
import { AppGrid } from './AppGrid';
import { ContextMenu } from './ContextMenu';
import { ParticleBackground } from '../effects/ParticleBackground';
import { ScanlineOverlay } from '../effects/ScanlineOverlay';
import { StartupScreen } from '../effects/StartupScreen';
import { useVioStore } from '../../core/stores/vioStore';
import { useUiStore } from '../../core/stores/uiStore';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { usePlatformStore } from '../../core/platform/platformStore';
import { useKeyboard } from '../../hooks/useKeyboard';
import { loadWorkspaceLayout, migrateMonitors, saveWorkspaceLayout } from '../../core/persistence/layoutPersistence';
import { getMonitors } from '../../api/monitor';
import { getPlatform } from '../../api/platform';
import { TASKBAR_HEIGHT, STARTUP_DURATION, LAYOUT_SAVE_DEBOUNCE } from '../../core/constants';
import type { TerminalType } from '../../core/types';

const IS_TAURI = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

const QUICK_LAUNCH: TerminalType[] = [
  'system-monitor',
  'shell',
  'file-manager',
  'network-map',
  'code-editor',
  'map',
  'media-player',
  'viewer-3d',
];

export function Desktop() {
  const { monitors, createWindow, blurAllWindows, handleMonitorChange, setMonitors } = useVioStore();
  const { theme, particleCount, scanlineIntensity, lowPowerMode } = useThemeStore();
  const { launcherVisible, appGridVisible, setLauncherVisible, setAppGridVisible } = useUiStore();
  const setPlatform = usePlatformStore((s) => s.setPlatform);
  const accent = theme.colors.accent;

  const [startupDone, setStartupDone] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  // Register keyboard shortcuts
  useKeyboard();

  // Detect platform
  useEffect(() => {
    if (!IS_TAURI) {
      const platform = navigator.platform.includes('Mac') ? 'macos' :
                       navigator.platform.includes('Win') ? 'windows' : 'linux';
      setPlatform(platform);
      return;
    }

    getPlatform().then((p) => {
      const platform = p === 'macos' ? 'macos' : p === 'windows' ? 'windows' : 'linux';
      setPlatform(platform);
    }).catch(() => {
      setPlatform('unknown');
    });
  }, [setPlatform]);

  // Load layout on startup
  useEffect(() => {
    const init = async () => {
      if (IS_TAURI) {
        try {
          const monitorInfos = await getMonitors();
          const saved = await loadWorkspaceLayout();

          if (saved) {
            const migrated = migrateMonitors(saved, monitorInfos.map((m) => ({
              id: m.id,
              bounds: m.bounds,
              dpi: m.dpi,
              isPrimary: m.is_primary,
            })));
            setMonitors(migrated);
          } else {
            handleMonitorChange(monitorInfos.map((m) => ({
              id: m.id,
              bounds: m.bounds,
              dpi: m.dpi,
              isPrimary: m.is_primary,
            })));
          }
        } catch {
          // Fallback: single monitor
          handleMonitorChange([{
            id: 'fallback',
            bounds: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
            dpi: 1,
            isPrimary: true,
          }]);
        }
      } else {
        handleMonitorChange([{
          id: 'fallback',
          bounds: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
          dpi: 1,
          isPrimary: true,
        }]);
      }
    };

    const timer = setTimeout(init, STARTUP_DURATION + 300);
    return () => clearTimeout(timer);
  }, [handleMonitorChange, setMonitors]);

  // Auto-save layout
  useEffect(() => {
    if (!IS_TAURI || monitors.length === 0) return;

    const timer = setTimeout(() => {
      saveWorkspaceLayout(monitors).catch(() => {});
    }, LAYOUT_SAVE_DEBOUNCE);

    return () => clearTimeout(timer);
  }, [monitors]);

  // Startup timer
  useEffect(() => {
    const timer = setTimeout(() => setStartupDone(true), STARTUP_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // Monitor change polling (every 5 seconds in Tauri)
  useEffect(() => {
    if (!IS_TAURI) return;

    const interval = setInterval(async () => {
      try {
        const current = await getMonitors();
        handleMonitorChange(current.map((m) => ({
          id: m.id,
          bounds: m.bounds,
          dpi: m.dpi,
          isPrimary: m.is_primary,
        })));
      } catch {
        // Ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [handleMonitorChange]);

  // Global context menu prevention
  useEffect(() => {
    const onCtx = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      e.preventDefault();
    };
    document.addEventListener('contextmenu', onCtx);
    return () => document.removeEventListener('contextmenu', onCtx);
  }, []);

  const handleCreateWindow = useCallback((type: TerminalType) => {
    createWindow(type);
    setLauncherVisible(false);
  }, [createWindow, setLauncherVisible]);

  const handleToggleLauncher = useCallback(() => {
    useUiStore.getState().toggleLauncher();
  }, []);

  const handleBlurAll = useCallback(() => {
    blurAllWindows();
  }, [blurAllWindows]);

  // Get all visible containers across all active workspaces
  const visibleContainers = monitors.flatMap((monitor) =>
    monitor.workspaces
      .filter((w) => w.isActive)
      .flatMap((workspace) =>
        workspace.containers.filter((c) => !c.windows.every((w) => w.isMinimized))
      )
  );

  // Build legacy WindowState list for TaskBar compatibility
  const allWindows = monitors.flatMap((monitor) =>
    monitor.workspaces.flatMap((workspace) =>
      workspace.containers.flatMap((container) => {
        const activeWindow = container.windows.find((w) => w.id === container.activeWindowId);
        if (!activeWindow) return [];
        return [{
          id: activeWindow.id,
          type: activeWindow.type,
          title: activeWindow.title,
          position: container.position,
          size: container.size,
          isMinimized: activeWindow.isMinimized,
          isMaximized: !!container.snapRegion,
          isFocused: activeWindow.isFocused,
          isVisible: true,
          zIndex: container.zIndex,
          config: activeWindow.config,
          createdAt: activeWindow.createdAt,
          updatedAt: activeWindow.updatedAt,
        }];
      })
    )
  );

  const focusWindow = useVioStore((s) => s.focusWindow);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: theme.colors.bgPrimary }}>
      {/* Grid background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage:
            `linear-gradient(${theme.colors.accentDim06} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.accentDim06} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
      {!lowPowerMode && <ParticleBackground color={accent} particleCount={lowPowerMode ? 20 : particleCount} />}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at center, transparent 0%, ${theme.colors.bgPrimary}66 60%, ${theme.colors.bgPrimary}cc 100%)`,
        }}
      />
      <ScanlineOverlay intensity={scanlineIntensity} color={accent} disableAnimation={lowPowerMode} />

      {/* Desktop area */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 10 }}
        onMouseDown={(e) => {
          const isInsideWindow = (e.target as HTMLElement).closest('[data-window-frame]') !== null;
          if (!isInsideWindow) handleBlurAll();
        }}
        onContextMenu={(e) => {
          const isInsideWindow = (e.target as HTMLElement).closest('[data-window-frame]') !== null;
          if (!isInsideWindow) {
            e.preventDefault();
            setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
          }
        }}
      >
        <AnimatePresence>
          {visibleContainers.map((container) => (
            <WindowFrame
              key={container.id}
              container={container}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Launcher */}
      <Launcher
        visible={launcherVisible}
        onSelect={handleCreateWindow}
        onClose={() => setLauncherVisible(false)}
      />

      {/* AppGrid */}
      <AppGrid
        visible={appGridVisible}
        onClose={() => setAppGridVisible(false)}
      />

      {/* TaskBar */}
      <TaskBar
        onToggleLauncher={handleToggleLauncher}
        windows={allWindows as unknown as import('../../types').WindowState[]}
        onFocusWindow={focusWindow}
        onBlurAll={handleBlurAll}
        onOpenAppGrid={() => setAppGridVisible(true)}
      />

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        items={[
          { label: '⧉ Window Grid', onClick: () => setAppGridVisible(true) },
          { label: '', onClick: () => {}, divider: true },
          { label: 'Arrange Windows', onClick: () => useVioStore.getState().arrangeWindows() },
          { label: 'Close All', onClick: () => useVioStore.getState().closeAllWindows() },
          { label: 'Reload', onClick: () => window.location.reload() },
        ]}
        onClose={() => setContextMenu({ visible: false, x: 0, y: 0 })}
        theme={theme}
      />

      {/* Startup Screen */}
      {!startupDone && <StartupScreen visible={true} />}

      {/* Hint when no windows open */}
      {startupDone && visibleContainers.length === 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                letterSpacing: 8,
                color: theme.colors.accentDim,
                fontFamily: theme.font.display,
                textShadow: `0 0 30px ${theme.colors.accentGlow}`,
              }}
            >
              V I O
            </div>
            <div
              style={{
                fontSize: 14,
                letterSpacing: 2,
                color: theme.colors.accentDim50,
                fontFamily: theme.font.mono,
              }}
            >
              Press {usePlatformStore.getState().isMac ? 'Cmd' : 'Ctrl'}+T to open a terminal
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
