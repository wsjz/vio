import { useState, useEffect, useRef, useCallback } from 'react';
import type { WindowState, ThemeConfig } from '../../types';
import { useWindowStore } from '../../core/window-manager/windowStore';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { TASKBAR_HEIGHT } from '../../core/constants';
import { ContextMenu } from './ContextMenu';

interface TaskBarProps {
  onToggleLauncher: () => void;
  windows: WindowState[];
  onFocusWindow: (id: string) => void;
  onBlurAll?: () => void;
  onOpenAppGrid?: () => void;
}

export function TaskBar({ onToggleLauncher, windows, onFocusWindow, onBlurAll, onOpenAppGrid }: TaskBarProps) {
  const createWindow = useWindowStore((s) => s.createWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const toggleMinimize = useWindowStore((s) => s.toggleMinimize);
  const arrangeWindows = useWindowStore((s) => s.arrangeWindows);
  const renameWindow = useWindowStore((s) => s.renameWindow);
  const { theme } = useThemeStore();
  const timeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxButtons, setMaxButtons] = useState(20);

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    winId: string;
  }>({ visible: false, x: 0, y: 0, winId: '' });

  // TaskBar blank-area context menu
  const [taskbarMenu, setTaskbarMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  // Rename state
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Clock: update DOM directly via ref to avoid full TaskBar re-render every second
  useEffect(() => {
    const update = () => {
      if (timeRef.current) {
        timeRef.current.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const reserved = 540;
      const available = containerWidth - reserved;
      const minButtonWidth = 45;
      const maxBtn = Math.max(3, Math.floor(available / minButtonWidth));
      setMaxButtons(maxBtn);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // Auto-focus rename input
  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);

  const handleRenameSubmit = useCallback(
    (id: string, value: string) => {
      const trimmed = value.trim();
      if (trimmed) renameWindow(id, trimmed);
      setRenaming(null);
    },
    [renameWindow]
  );

  const accent = theme.colors.accent;
  const accentDim = theme.colors.accentDim;
  const accentGlow = theme.colors.accentGlow;
  const textPrimary = theme.colors.textPrimary;
  const textSecondary = theme.colors.textSecondary;
  const textTertiary = theme.colors.textTertiary;
  const bgSecondary = theme.colors.bgSecondary;

  const showOverflow = windows.length > maxButtons;
  const displayedWindows = showOverflow ? windows.slice(0, maxButtons - 1) : windows;
  const overflowCount = windows.length - displayedWindows.length;

  const getButtonWidth = () => {
    if (!showOverflow) return undefined;
    const containerWidth = containerRef.current?.clientWidth || 1200;
    const reserved = 540;
    const available = containerWidth - reserved;
    const count = displayedWindows.length + (overflowCount > 0 ? 1 : 0);
    return Math.max(40, Math.floor(available / count));
  };

  const compressedWidth = getButtonWidth();

  const handleCtxMenu = (e: React.MouseEvent, winId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, winId });
    setTaskbarMenu((prev) => ({ ...prev, visible: false }));
  };

  const closeCtxMenu = () => setCtxMenu((prev) => ({ ...prev, visible: false }));

  const handleTaskbarCtxMenu = (e: React.MouseEvent) => {
    // Only trigger on the TaskBar container itself, not on child elements
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    setTaskbarMenu({ visible: true, x: e.clientX, y: e.clientY });
    setCtxMenu((prev) => ({ ...prev, visible: false }));
  };

  const closeTaskbarMenu = () => setTaskbarMenu((prev) => ({ ...prev, visible: false }));

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: TASKBAR_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
        zIndex: 1000,
        background: bgSecondary + 'eb',
        backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${theme.colors.accentDim10 ?? accentDim}`,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onBlurAll) onBlurAll();
      }}
      onContextMenu={handleTaskbarCtxMenu}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 3,
          color: accent,
          textShadow: `0 0 10px ${theme.colors.accentGlow40}`,
          fontFamily: theme.font.display,
          flexShrink: 0,
        }}
      >
        VIO
      </div>
      <div style={{ width: 1, height: 18, background: accentDim, flexShrink: 0 }} />
      <button
        onClick={onToggleLauncher}
        style={{
          padding: '4px 12px',
          fontSize: 11,
          color: accent,
          border: `1px solid ${accentDim}`,
          borderRadius: 3,
          background: accentGlow,
          cursor: 'default',
          fontFamily: theme.font.ui,
          letterSpacing: 1,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        ⊕ New
      </button>
      <button
        onClick={arrangeWindows}
        title="Arrange Windows"
        style={{
          padding: '4px 10px',
          fontSize: 11,
          color: accent,
          border: `1px solid ${accentDim}`,
          borderRadius: 3,
          background: accentGlow,
          cursor: 'default',
          fontFamily: theme.font.ui,
          letterSpacing: 1,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        ⧉ Arrange
      </button>

      {/* Window buttons container */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {displayedWindows.map((win) => (
          <div
            key={win.id}
            onContextMenu={(e) => handleCtxMenu(e, win.id)}
            style={{
              position: 'relative',
              flexShrink: 1,
              minWidth: 32,
              maxWidth: compressedWidth || 140,
              width: compressedWidth,
            }}
          >
            {renaming?.id === win.id ? (
              <input
                ref={renameInputRef}
                value={renaming.value}
                onChange={(e) => setRenaming({ id: win.id, value: e.target.value })}
                onBlur={() => handleRenameSubmit(win.id, renaming.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(win.id, renaming.value);
                  if (e.key === 'Escape') setRenaming(null);
                }}
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  fontSize: 11,
                  borderRadius: 3,
                  border: `1px solid ${accent}`,
                  background: bgSecondary,
                  color: textPrimary,
                  fontFamily: theme.font.ui,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <button
                onClick={() => {
                  if (win.isMinimized) toggleMinimize(win.id);
                  onFocusWindow(win.id);
                }}
                onDoubleClick={() => setRenaming({ id: win.id, value: win.title })}
                title={`${win.title} — right-click for options, double-click to rename`}
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  fontSize: 11,
                  borderRadius: 3,
                  cursor: 'default',
                  fontFamily: theme.font.ui,
                  letterSpacing: 1,
                  color: win.isFocused && !win.isMinimized ? accent : win.isMinimized ? textTertiary : textSecondary,
                  border: win.isFocused && !win.isMinimized ? `1px solid ${accentDim}` : '1px solid transparent',
                  background: win.isFocused && !win.isMinimized ? accentGlow : 'transparent',
                  opacity: win.isMinimized ? 0.5 : 1,
                  textDecoration: win.isMinimized ? 'line-through' : 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {win.title.length > 12 && compressedWidth ? `${win.title.slice(0, 10)}...` : win.title}
              </button>
            )}
          </div>
        ))}
        {overflowCount > 0 && (
          <OverflowMenuButton
            count={overflowCount}
            windows={windows.slice(maxButtons - 1)}
            onSelect={(id) => {
              const win = windows.find((w) => w.id === id);
              if (win?.isMinimized) toggleMinimize(id);
              onFocusWindow(id);
            }}
            onContextMenu={handleCtxMenu}
            theme={theme}
          />
        )}
      </div>

      <button
        onClick={() => createWindow('settings')}
        style={{
          padding: '4px 12px',
          fontSize: 11,
          borderRadius: 3,
          cursor: 'default',
          fontFamily: theme.font.ui,
          letterSpacing: 1,
          color: textSecondary,
          border: '1px solid transparent',
          background: 'transparent',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = accent; e.currentTarget.style.borderColor = theme.colors.accentDim20; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = textSecondary; e.currentTarget.style.borderColor = 'transparent'; }}
      >
        ⚙ Settings
      </button>
      <div ref={timeRef} style={{ marginLeft: 'auto', fontFamily: theme.font.mono, fontSize: 12, letterSpacing: 1, color: textTertiary, flexShrink: 0 }}>
        {/* Time updated via ref to avoid re-render */}
      </div>

      {/* Window context menu */}
      {ctxMenu.visible && (
        <WindowContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          winId={ctxMenu.winId}
          onClose={closeCtxMenu}
          onFocus={(id) => { onFocusWindow(id); closeCtxMenu(); }}
          onCloseWindow={(id) => { closeWindow(id); closeCtxMenu(); }}
          onRename={(id) => {
            const win = windows.find((w) => w.id === id);
            if (win) setRenaming({ id, value: win.title });
            closeCtxMenu();
          }}
          theme={theme}
        />
      )}

      {/* TaskBar blank-area context menu */}
      {taskbarMenu.visible && (
        <TaskBarContextMenu
          x={taskbarMenu.x}
          y={taskbarMenu.y}
          onClose={closeTaskbarMenu}
          onToggleLauncher={() => { onToggleLauncher(); closeTaskbarMenu(); }}
          onArrange={() => { arrangeWindows(); closeTaskbarMenu(); }}
          onCloseAll={() => { useWindowStore.getState().closeAllWindows(); closeTaskbarMenu(); }}
          onOpenSettings={() => { createWindow('settings'); closeTaskbarMenu(); }}
          onOpenAppGrid={() => { onOpenAppGrid?.(); closeTaskbarMenu(); }}
          theme={theme}
        />
      )}
    </div>
  );
}

/* ─── Overflow Menu Button ─── */
interface OverflowMenuButtonProps {
  count: number;
  windows: WindowState[];
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, winId: string) => void;
  theme: ThemeConfig;
}

function OverflowMenuButton({ count, windows, onSelect, onContextMenu, theme }: OverflowMenuButtonProps) {
  const [visible, setVisible] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const accentDim = theme.colors.accentDim;
  const textSecondary = theme.colors.textSecondary;

  useEffect(() => {
    if (!visible) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [visible]);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={() => setVisible((v) => !v)}
        style={{
          padding: '4px 8px',
          fontSize: 11,
          borderRadius: 3,
          cursor: 'default',
          fontFamily: theme.font.ui,
          color: textSecondary,
          border: `1px solid ${theme.colors.accentDim20}`,
          background: 'transparent',
          whiteSpace: 'nowrap',
        }}
        title={`${count} more window${count > 1 ? 's' : ''}`}
      >
        +{count}
      </button>
      {visible && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 4px)',
            right: 0,
            zIndex: 9999,
            minWidth: 160,
            maxHeight: 240,
            overflow: 'auto',
            background: theme.colors.bgSecondary + 'f0',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${theme.colors.borderDefault}`,
            borderRadius: 6,
            padding: '4px 0',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 16px ${theme.colors.accentGlow10}`,
            fontFamily: theme.font.mono,
            fontSize: 12,
          }}
        >
          {windows.map((win) => (
            <button
              key={win.id}
              onContextMenu={(e) => { onContextMenu(e, win.id); setVisible(false); }}
              onClick={() => { onSelect(win.id); setVisible(false); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 16px',
                textAlign: 'left',
                background: win.isFocused ? (theme.colors.accentGlow12) : 'transparent',
                border: 'none',
                color: win.isFocused ? theme.colors.accent : win.isMinimized ? theme.colors.textTertiary : theme.colors.textPrimary,
                fontFamily: theme.font.mono,
                fontSize: 12,
                cursor: 'default',
                transition: 'background 0.15s',
                opacity: win.isMinimized ? 0.5 : 1,
                textDecoration: win.isMinimized ? 'line-through' : 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = theme.colors.accentGlow12;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = win.isFocused
                  ? (theme.colors.accentGlow12)
                  : 'transparent';
              }}
              title={win.title}
            >
              {win.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Window Context Menu ─── */
interface WindowContextMenuProps {
  x: number;
  y: number;
  winId: string;
  onClose: () => void;
  onFocus: (id: string) => void;
  onCloseWindow: (id: string) => void;
  onRename: (id: string) => void;
  theme: ThemeConfig;
}

/* ─── TaskBar Blank-Area Context Menu ─── */
interface TaskBarContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onToggleLauncher: () => void;
  onArrange: () => void;
  onCloseAll: () => void;
  onOpenSettings: () => void;
  onOpenAppGrid?: () => void;
  theme: ThemeConfig;
}

function TaskBarContextMenu({ x, y, onClose, onToggleLauncher, onArrange, onCloseAll, onOpenSettings, onOpenAppGrid, theme }: TaskBarContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const items = [
    { label: '⊕ New Terminal', onClick: onToggleLauncher },
    { label: '⧉ Window Grid', onClick: onOpenAppGrid || (() => {}) },
    { label: '◉ Arrange Windows', onClick: onArrange },
    { divider: true },
    { label: '✕ Close All', onClick: onCloseAll },
    { divider: true },
    { label: '⚙ Settings', onClick: onOpenSettings },
  ];

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        bottom: 40,
        zIndex: 9999,
        minWidth: 160,
        background: theme.colors.bgSecondary + 'f0',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${theme.colors.borderDefault}`,
        borderRadius: 6,
        padding: '4px 0',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 16px ${theme.colors.accentGlow10}`,
        fontFamily: theme.font.mono,
        fontSize: 12,
      }}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div
            key={i}
            style={{
              height: 1,
              background: theme.colors.accentDim15,
              margin: '4px 8px',
            }}
          />
        ) : (
          <button
            key={i}
            onClick={item.onClick}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 16px',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              color: theme.colors.textPrimary,
              fontFamily: theme.font.mono,
              fontSize: 12,
              cursor: 'default',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = theme.colors.accentGlow12;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

function WindowContextMenu({ x, y, winId, onClose, onFocus, onCloseWindow, onRename, theme }: WindowContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const items = [
    { label: 'Focus', onClick: () => onFocus(winId) },
    { label: 'Rename', onClick: () => onRename(winId) },
    { divider: true },
    { label: 'Close', onClick: () => onCloseWindow(winId) },
  ];

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        bottom: 40,
        zIndex: 9999,
        minWidth: 120,
        background: theme.colors.bgSecondary + 'f0',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${theme.colors.borderDefault}`,
        borderRadius: 6,
        padding: '4px 0',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 16px ${theme.colors.accentGlow10}`,
        fontFamily: theme.font.mono,
        fontSize: 12,
      }}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div
            key={i}
            style={{
              height: 1,
              background: theme.colors.accentDim15,
              margin: '4px 8px',
            }}
          />
        ) : (
          <button
            key={i}
            onClick={item.onClick}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 16px',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              color: theme.colors.textPrimary,
              fontFamily: theme.font.mono,
              fontSize: 12,
              cursor: 'default',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = theme.colors.accentGlow12;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
