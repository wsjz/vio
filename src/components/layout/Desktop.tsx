import { useState, useCallback, useEffect, useRef } from 'react';
import { WindowFrame } from '../window/WindowFrame';
import { TaskBar } from './TaskBar';
import { Launcher } from './Launcher';
import { ParticleBackground } from '../effects/ParticleBackground';
import { ScanlineOverlay } from '../effects/ScanlineOverlay';
import { StartupScreen } from '../effects/StartupScreen';
import { useWindowStore } from '../../core/window-manager/windowStore';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { computeTiledLayout } from '../../core/window-manager/tileWindows';
import { loadLayout, saveLayout } from '../../api/tauri';
import type { TerminalType } from '../../types';

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
  const { windows, createWindow, closeWindow, focusWindow, toggleMinimize, toggleMaximize } = useWindowStore();
  const { theme, particleCount, scanlineIntensity, lowPowerMode } = useThemeStore();
  const [launcherVisible, setLauncherVisible] = useState(false);
  const [startupDone, setStartupDone] = useState(false);
  const windowsRef = useRef(windows);
  windowsRef.current = windows;

  const accent = theme.colors.accent;

  // Load last-session layout on startup, fallback to tiled layout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (IS_TAURI) {
        loadLayout('last-session')
          .then((data) => {
            data.windows.forEach((w) => {
              createWindow(w.window_type as TerminalType, {}, {
                position: { x: w.position.x, y: w.position.y },
                size: { width: w.size.width, height: w.size.height },
              });
            });
          })
          .catch(() => {
            // Fallback to tiled layout
            const screenW = window.innerWidth;
            const screenH = window.innerHeight - 36;
            const layouts = computeTiledLayout(screenW, screenH);
            layouts.forEach((layout) => {
              createWindow(layout.type, {}, {
                position: layout.position,
                size: layout.size,
              });
            });
          });
      } else {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight - 36;
        const layouts = computeTiledLayout(screenW, screenH);
        layouts.forEach((layout) => {
          createWindow(layout.type, {}, {
            position: layout.position,
            size: layout.size,
          });
        });
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [createWindow]);

  // Auto-save last-session layout when windows change (debounced)
  useEffect(() => {
    if (!IS_TAURI || windows.length === 0) return;
    const timer = setTimeout(() => {
      const layoutWindows = windows.map((w) => ({
        window_type: w.type,
        position: { x: w.position.x, y: w.position.y },
        size: { width: w.size.width, height: w.size.height },
      }));
      saveLayout('last-session', 'Auto-saved session', layoutWindows).catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [windows]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartupDone(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateWindow = useCallback((type: TerminalType) => {
    createWindow(type);
    setLauncherVisible(false);
  }, [createWindow]);

  const handleToggleLauncher = useCallback(() => {
    setLauncherVisible((prev) => !prev);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // Launcher toggle
      if (isMod && e.key === 't') {
        e.preventDefault();
        setLauncherVisible((prev) => !prev);
        return;
      }

      // Close launcher
      if (e.key === 'Escape') {
        setLauncherVisible(false);
        return;
      }

      if (launcherVisible) {
        // Number keys to select from launcher
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= QUICK_LAUNCH.length) {
          e.preventDefault();
          handleCreateWindow(QUICK_LAUNCH[num - 1]);
        }
        return;
      }

      const currentWindows = windowsRef.current;
      const focusedWin = currentWindows.find((w) => w.isFocused);

      // Close focused window
      if (isMod && e.key === 'w') {
        e.preventDefault();
        if (focusedWin) closeWindow(focusedWin.id);
        return;
      }

      // Minimize focused window
      if (isMod && e.key === 'm' && !e.shiftKey) {
        e.preventDefault();
        if (focusedWin) toggleMinimize(focusedWin.id);
        return;
      }

      // Maximize/restore focused window
      if (isMod && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        if (focusedWin) toggleMaximize(focusedWin.id);
        return;
      }

      // Cycle windows forward
      if (isMod && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const visible = currentWindows.filter((w) => !w.isMinimized);
        if (visible.length === 0) return;
        const idx = visible.findIndex((w) => w.id === focusedWin?.id);
        const next = visible[(idx + 1) % visible.length];
        focusWindow(next.id);
        return;
      }

      // Cycle windows backward
      if (isMod && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        const visible = currentWindows.filter((w) => !w.isMinimized);
        if (visible.length === 0) return;
        const idx = visible.findIndex((w) => w.id === focusedWin?.id);
        const prev = visible[(idx - 1 + visible.length) % visible.length];
        focusWindow(prev.id);
        return;
      }

      // Quick launch terminals via Ctrl/Cmd + 1~9
      if (isMod && !e.shiftKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= QUICK_LAUNCH.length) {
          e.preventDefault();
          createWindow(QUICK_LAUNCH[num - 1]);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [launcherVisible, closeWindow, toggleMinimize, toggleMaximize, focusWindow, createWindow, handleCreateWindow]);

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
            `linear-gradient(${theme.colors.accentDim.replace('0.3', '0.03')} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.accentDim.replace('0.3', '0.03')} 1px, transparent 1px)`,
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
          background: `radial-gradient(ellipse at center, transparent 0%, ${theme.colors.bgPrimary}99 70%, ${theme.colors.bgPrimary}e6 100%)`,
        }}
      />
      <ScanlineOverlay intensity={scanlineIntensity} color={accent} disableAnimation={lowPowerMode} />

      {/* Desktop area */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}>
        {windows.filter((w) => !w.isMinimized).map((win) => (
          <WindowFrame
            key={win.id}
            window={win}
            onFocus={() => focusWindow(win.id)}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => toggleMinimize(win.id)}
            onMaximize={() => toggleMaximize(win.id)}
          />
        ))}
      </div>

      {/* Launcher */}
      <Launcher
        visible={launcherVisible}
        onSelect={handleCreateWindow}
        onClose={() => setLauncherVisible(false)}
      />

      {/* TaskBar */}
      <TaskBar
        onToggleLauncher={handleToggleLauncher}
        windows={windows}
        onFocusWindow={focusWindow}
      />

      {/* Startup Screen */}
      {!startupDone && <StartupScreen visible={true} />}

      {/* Hint when no windows open */}
      {startupDone && windows.length === 0 && (
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
                color: theme.colors.accentDim.replace('0.3', '0.5'),
                fontFamily: theme.font.mono,
              }}
            >
              Press Ctrl+T to open a terminal
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
