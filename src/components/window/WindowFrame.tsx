import { useRef, useCallback, useEffect } from 'react';
import type { WindowState } from '../../types';
import { WindowContent } from './WindowContent';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { useWindowStore } from '../../core/window-manager/windowStore';

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
  const windows = useWindowStore((s) => s.windows);
  const anyFocused = windows.some((w) => w.isFocused);
  const isActive = win.isFocused || !anyFocused;

  const accent = theme.colors.accent;
  const accentDim = theme.colors.accentDim;
  const accentGlow = theme.colors.accentGlow;

  // Keep a ref to the latest onFocus so the effect doesn't need to re-bind
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

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
            frameRef.current.style.width = `${Math.max(320, startPosRef.current.width + dx)}px`;
          }
          if (dir.includes('s')) {
            frameRef.current.style.height = `${Math.max(200, startPosRef.current.height + dy)}px`;
          }
          if (dir.includes('w')) {
            const newW = Math.max(320, startPosRef.current.width - dx);
            frameRef.current.style.width = `${newW}px`;
            frameRef.current.style.left = `${startPosRef.current.left + startPosRef.current.width - newW}px`;
          }
          if (dir.includes('n')) {
            const newH = Math.max(200, startPosRef.current.height - dy);
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
        updateWindowPosition(win.id, { x: left, y: top });
      }
      if (resizingRef.current && frameRef.current) {
        const width = parseInt(frameRef.current.style.width || '0', 10);
        const height = parseInt(frameRef.current.style.height || '0', 10);
        updateWindowSize(win.id, { width, height });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        border: `1px solid ${isActive ? accentDim.replace('0.3', '0.5') : theme.colors.borderDefault}`,
        borderRadius: '4px',
        boxShadow: isActive
          ? `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${accentGlow.replace('0.15', '0.25')}, 0 0 40px ${accentGlow.replace('0.15', '0.12')}, inset 0 0 0 1px ${accentGlow.replace('0.15', '0.1')}`
          : `0 10px 40px rgba(0,0,0,0.5), 0 0 10px ${accentGlow.replace('0.15', '0.08')}`,
        minWidth: '320px',
        minHeight: '200px',
      }}
      onMouseDown={() => { onFocus(); focusContentInput(); }}
    >
      {/* Corner decorations */}
      <div style={{ ...cornerStyle, top: 4, left: 4, borderTop: `1px solid ${accentDim.replace('0.3', '0.3')}`, borderLeft: `1px solid ${accentDim.replace('0.3', '0.3')}` }} />
      <div style={{ ...cornerStyle, top: 4, right: 4, borderTop: `1px solid ${accentDim.replace('0.3', '0.3')}`, borderRight: `1px solid ${accentDim.replace('0.3', '0.3')}` }} />
      <div style={{ ...cornerStyle, bottom: 4, left: 4, borderBottom: `1px solid ${accentDim.replace('0.3', '0.3')}`, borderLeft: `1px solid ${accentDim.replace('0.3', '0.3')}` }} />
      <div style={{ ...cornerStyle, bottom: 4, right: 4, borderBottom: `1px solid ${accentDim.replace('0.3', '0.3')}`, borderRight: `1px solid ${accentDim.replace('0.3', '0.3')}` }} />

      {/* Title bar */}
      <div
        style={{
          height: 28,
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isActive ? `${accentGlow.replace('0.15', '0.06')}` : 'transparent',
          borderBottom: `1px solid ${isActive ? accentDim.replace('0.3', '0.15') : 'rgba(255,255,255,0.03)'}`,
          cursor: 'move',
          transition: 'background 0.2s, border-color 0.2s',
        }}
        onMouseDown={handleTitleMouseDown}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status indicator */}
          <div
            style={{
              width: 3,
              height: 12,
              borderRadius: 1,
              background: isActive ? accent : theme.colors.textTertiary,
              opacity: isActive ? 1 : 0.3,
              boxShadow: isActive ? `0 0 6px ${accentGlow}` : 'none',
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: isActive ? accent : theme.colors.textTertiary,
              fontFamily: theme.font.mono,
              opacity: isActive ? 1 : 0.6,
            }}
          >
            {win.title}
          </span>
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
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accentGlow.replace('0.15', '0.1'); (e.currentTarget as HTMLButtonElement).style.color = accent; }}
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
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accentGlow.replace('0.15', '0.1'); (e.currentTarget as HTMLButtonElement).style.color = accent; }}
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
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accentGlow.replace('0.15', '0.1'); (e.currentTarget as HTMLButtonElement).style.color = accent; }}
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
    </div>
  );
}
