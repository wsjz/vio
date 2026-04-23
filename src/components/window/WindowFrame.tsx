import { useRef, useCallback, useEffect, useState } from 'react';
import type { WindowState, ThemeConfig } from '../../types';
import { WindowContent } from './WindowContent';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { useWindowStore } from '../../core/window-manager/windowStore';
import { MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from '../../core/constants';

interface WindowFrameProps {
  window: WindowState;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}

export function WindowFrame({ window: win, onFocus, onClose, onMinimize, onMaximize }: WindowFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const resizingRef = useRef<string | null>(null);
  const startPosRef = useRef({ x: 0, y: 0, left: 0, top: 0, width: 0, height: 0 });
  const { theme } = useThemeStore();
  const updateWindowPosition = useWindowStore((s) => s.updateWindowPosition);
  const updateWindowSize = useWindowStore((s) => s.updateWindowSize);
  const renameWindow = useWindowStore((s) => s.renameWindow);
  // Only subscribe to whether any window is focused, not the whole windows array
  const anyFocused = useWindowStore((s) => s.windows.some((w) => w.isFocused));
  const isActive = win.isFocused || !anyFocused;

  // Title rename state
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(win.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);

  const accent = theme.colors.accent;
  const accentDim = theme.colors.accentDim;
  const accentGlow = theme.colors.accentGlow;

  // Keep refs to latest props so the effect doesn't need to re-bind
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  const winIdRef = useRef(win.id);
  winIdRef.current = win.id;
  const updatePositionRef = useRef(updateWindowPosition);
  updatePositionRef.current = updateWindowPosition;
  const updateSizeRef = useRef(updateWindowSize);
  updateSizeRef.current = updateWindowSize;

  const focusContentInput = useCallback(() => {
    requestAnimationFrame(() => {
      if (!frameRef.current) return;
      const input = frameRef.current.querySelector('input');
      if (input) {
        (input as HTMLInputElement).focus();
      }
    });
  }, []);

  const handleTitleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: win.position.x,
      top: win.position.y,
      width: win.size.width,
      height: win.size.height,
    };
    focusContentInput();
  }, [win.position, win.size, focusContentInput]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, dir: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = dir;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: win.position.x,
      top: win.position.y,
      width: win.size.width,
      height: win.size.height,
    };
  }, [win.position, win.size]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingRef.current) {
        const dx = e.clientX - startPosRef.current.x;
        const dy = e.clientY - startPosRef.current.y;
        if (frameRef.current) {
          frameRef.current.style.left = `${startPosRef.current.left + dx}px`;
          frameRef.current.style.top = `${startPosRef.current.top + dy}px`;
        }
      } else if (resizingRef.current) {
        const dx = e.clientX - startPosRef.current.x;
        const dy = e.clientY - startPosRef.current.y;
        const dir = resizingRef.current;
        if (frameRef.current) {
          if (dir.includes('e')) {
            frameRef.current.style.width = `${Math.max(MIN_WINDOW_WIDTH, startPosRef.current.width + dx)}px`;
          }
          if (dir.includes('s')) {
            frameRef.current.style.height = `${Math.max(MIN_WINDOW_HEIGHT, startPosRef.current.height + dy)}px`;
          }
          if (dir.includes('w')) {
            const newW = Math.max(MIN_WINDOW_WIDTH, startPosRef.current.width - dx);
            frameRef.current.style.width = `${newW}px`;
            frameRef.current.style.left = `${startPosRef.current.left + startPosRef.current.width - newW}px`;
          }
          if (dir.includes('n')) {
            const newH = Math.max(MIN_WINDOW_HEIGHT, startPosRef.current.height - dy);
            frameRef.current.style.height = `${newH}px`;
            frameRef.current.style.top = `${startPosRef.current.top + startPosRef.current.height - newH}px`;
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (draggingRef.current && frameRef.current) {
        const left = parseInt(frameRef.current.style.left || '0', 10);
        const top = parseInt(frameRef.current.style.top || '0', 10);
        updatePositionRef.current(winIdRef.current, { x: left, y: top });
      }
      if (resizingRef.current && frameRef.current) {
        const width = parseInt(frameRef.current.style.width || '0', 10);
        const height = parseInt(frameRef.current.style.height || '0', 10);
        updateSizeRef.current(winIdRef.current, { width, height });
      }
      // Only trigger focus after drag/resize finishes to avoid re-render mid-drag
      if (draggingRef.current || resizingRef.current) {
        onFocusRef.current();
      }
      draggingRef.current = false;
      resizingRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    // No deps needed — all mutable values are accessed through refs
  }, []);

  const cornerStyle: React.CSSProperties = {
    position: 'absolute',
    width: 8,
    height: 8,
    pointerEvents: 'none',
  };

  return (
    <div
      ref={frameRef}
      data-window-frame
      data-window-id={win.id}
      style={{
        position: 'absolute',
        overflow: 'hidden',
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
        zIndex: win.zIndex,
        background: theme.colors.bgSecondary + 'b0',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${isActive ? theme.colors.accentDim50 : theme.colors.borderDefault}`,
        borderRadius: '4px',
        boxShadow: isActive
          ? `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${theme.colors.accentGlow25}, 0 0 40px ${theme.colors.accentGlow12}, inset 0 0 0 1px ${theme.colors.accentGlow10}`
          : `0 10px 40px rgba(0,0,0,0.5), 0 0 10px ${theme.colors.accentGlow08}`,
        minWidth: `${MIN_WINDOW_WIDTH}px`,
        minHeight: `${MIN_WINDOW_HEIGHT}px`,
      }}
      onMouseDown={() => { onFocus(); focusContentInput(); }}
    >
      {/* Corner decorations */}
      <div style={{ ...cornerStyle, top: 4, left: 4, borderTop: `1px solid ${accentDim}`, borderLeft: `1px solid ${accentDim}` }} />
      <div style={{ ...cornerStyle, top: 4, right: 4, borderTop: `1px solid ${accentDim}`, borderRight: `1px solid ${accentDim}` }} />
      <div style={{ ...cornerStyle, bottom: 4, left: 4, borderBottom: `1px solid ${accentDim}`, borderLeft: `1px solid ${accentDim}` }} />
      <div style={{ ...cornerStyle, bottom: 4, right: 4, borderBottom: `1px solid ${accentDim}`, borderRight: `1px solid ${accentDim}` }} />

      {/* Title bar */}
      <div
        style={{
          height: 28,
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isActive ? `${theme.colors.accentGlow06}` : 'transparent',
          borderBottom: `1px solid ${isActive ? theme.colors.accentDim15 : 'rgba(255,255,255,0.03)'}`,
          cursor: 'move',
          transition: 'background 0.2s, border-color 0.2s',
        }}
        onMouseDown={handleTitleMouseDown}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCtxMenu({ visible: true, x: e.clientX, y: e.clientY });
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          {/* Status indicator */}
          <div
            style={{
              width: 3,
              height: 12,
              borderRadius: 1,
              background: isActive ? accent : theme.colors.textTertiary,
              opacity: isActive ? 1 : 0.3,
              boxShadow: isActive ? `0 0 6px ${accentGlow}` : 'none',
              flexShrink: 0,
            }}
          />
          {renaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => {
                const trimmed = renameValue.trim();
                if (trimmed) renameWindow(win.id, trimmed);
                setRenaming(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = renameValue.trim();
                  if (trimmed) renameWindow(win.id, trimmed);
                  setRenaming(false);
                }
                if (e.key === 'Escape') {
                  setRenameValue(win.title);
                  setRenaming(false);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                fontSize: 10,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 2,
                color: accent,
                fontFamily: theme.font.mono,
                background: 'transparent',
                border: `1px solid ${accent}`,
                borderRadius: 2,
                outline: 'none',
                padding: '0 4px',
                height: 20,
                minWidth: 0,
              }}
            />
          ) : (
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 2,
                color: isActive ? accent : theme.colors.textTertiary,
                fontFamily: theme.font.mono,
                opacity: isActive ? 1 : 0.6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setRenaming(true);
                setRenameValue(win.title);
              }}
            >
              {win.title}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Minimize: horizontal line */}
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            title="Minimize"
            style={{
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'default',
              borderRadius: 3,
              color: theme.colors.textTertiary,
              fontSize: 10,
              fontFamily: theme.font.mono,
              padding: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.colors.accentGlow10 ?? accentGlow; (e.currentTarget as HTMLButtonElement).style.color = accent; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = theme.colors.textTertiary; }}
          >
            −
          </button>
          {/* Maximize: square brackets */}
          <button
            onClick={(e) => { e.stopPropagation(); onMaximize(); }}
            title="Maximize"
            style={{
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'default',
              borderRadius: 3,
              color: theme.colors.textTertiary,
              fontSize: 10,
              fontFamily: theme.font.mono,
              padding: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.colors.accentGlow10 ?? accentGlow; (e.currentTarget as HTMLButtonElement).style.color = accent; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = theme.colors.textTertiary; }}
          >
            □
          </button>
          {/* Close: X */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            title="Close"
            style={{
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'default',
              borderRadius: 3,
              color: theme.colors.textTertiary,
              fontSize: 10,
              fontFamily: theme.font.mono,
              padding: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.colors.accentGlow10 ?? accentGlow; (e.currentTarget as HTMLButtonElement).style.color = accent; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = theme.colors.textTertiary; }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: 12, overflow: 'auto', height: 'calc(100% - 28px)' }}>
        <WindowContent window={win} />
      </div>

      {/* Resize handles */}
      {!win.isMaximized && (
        <>
          <div style={{ position: 'absolute', top: -3, left: 8, right: 8, height: 6, cursor: 'ns-resize' }} onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
          <div style={{ position: 'absolute', bottom: -3, left: 8, right: 8, height: 6, cursor: 'ns-resize' }} onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
          <div style={{ position: 'absolute', right: -3, top: 8, bottom: 8, width: 6, cursor: 'ew-resize' }} onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
          <div style={{ position: 'absolute', left: -3, top: 8, bottom: 8, width: 6, cursor: 'ew-resize' }} onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
          <div style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, cursor: 'nesw-resize' }} onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
          <div style={{ position: 'absolute', top: -3, left: -3, width: 12, height: 12, cursor: 'nwse-resize' }} onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
          <div style={{ position: 'absolute', bottom: -3, right: -3, width: 12, height: 12, cursor: 'nwse-resize' }} onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
          <div style={{ position: 'absolute', bottom: -3, left: -3, width: 12, height: 12, cursor: 'nesw-resize' }} onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
        </>
      )}

      {/* Title bar context menu */}
      {ctxMenu.visible && (
        <WindowTitleContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu({ visible: false, x: 0, y: 0 })}
          onFocus={() => { onFocus(); setCtxMenu({ visible: false, x: 0, y: 0 }); }}
          onRename={() => { setRenaming(true); setRenameValue(win.title); setCtxMenu({ visible: false, x: 0, y: 0 }); }}
          onCloseWindow={() => { onClose(); setCtxMenu({ visible: false, x: 0, y: 0 }); }}
          theme={theme}
        />
      )}
    </div>
  );
}

/* ─── Title Bar Context Menu ─── */
interface WindowTitleContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onFocus: () => void;
  onRename: () => void;
  onCloseWindow: () => void;
  theme: import('../../types').ThemeConfig;
}

function WindowTitleContextMenu({ x, y, onClose, onFocus, onRename, onCloseWindow, theme }: WindowTitleContextMenuProps) {
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
    { label: 'Focus', onClick: onFocus },
    { label: 'Rename', onClick: onRename },
    { divider: true },
    { label: 'Close', onClick: onCloseWindow },
  ];

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
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
