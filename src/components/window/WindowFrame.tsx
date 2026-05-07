// src/components/window/WindowFrame.tsx
import { useRef, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Container, WindowState } from '../../core/types';
import { WindowContent } from './WindowContent';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { useVioStore } from '../../core/stores/vioStore';
import { CornerDecor } from '../effects/CornerDecor';
import { MIN_CONTAINER_WIDTH, MIN_CONTAINER_HEIGHT } from '../../lib/geometry';

interface WindowFrameProps {
  container: Container;
}

export function WindowFrame({ container }: WindowFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const resizingRef = useRef<string | null>(null);
  const startPosRef = useRef({ x: 0, y: 0, left: 0, top: 0, width: 0, height: 0 });
  const { theme } = useThemeStore();
  const moveContainer = useVioStore((s) => s.moveContainer);
  const resizeContainer = useVioStore((s) => s.resizeContainer);
  const focusWindow = useVioStore((s) => s.focusWindow);
  const snapContainer = useVioStore((s) => s.snapContainer);
  const unsnapContainer = useVioStore((s) => s.unsnapContainer);

  const activeWindow = container.windows.find((w) => w.id === container.activeWindowId) || container.windows[0];
  if (!activeWindow) return null;

  const isActive = activeWindow.isFocused;
  const accent = theme.colors.accent;
  const accentDim = theme.colors.accentDim;
  const accentGlow = theme.colors.accentGlow;

  const handleTitleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: container.position.x,
      top: container.position.y,
      width: container.size.width,
      height: container.size.height,
    };
    focusWindow(activeWindow.id);
  }, [container.position, container.size, container.id, focusWindow, activeWindow.id]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, dir: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = dir;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: container.position.x,
      top: container.position.y,
      width: container.size.width,
      height: container.size.height,
    };
  }, [container.position, container.size]);

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
            frameRef.current.style.width = `${Math.max(MIN_CONTAINER_WIDTH, startPosRef.current.width + dx)}px`;
          }
          if (dir.includes('s')) {
            frameRef.current.style.height = `${Math.max(MIN_CONTAINER_HEIGHT, startPosRef.current.height + dy)}px`;
          }
          if (dir.includes('w')) {
            const newW = Math.max(MIN_CONTAINER_WIDTH, startPosRef.current.width - dx);
            frameRef.current.style.width = `${newW}px`;
            frameRef.current.style.left = `${startPosRef.current.left + startPosRef.current.width - newW}px`;
          }
          if (dir.includes('n')) {
            const newH = Math.max(MIN_CONTAINER_HEIGHT, startPosRef.current.height - dy);
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
        moveContainer(container.id, { x: left, y: top });
      }
      if (resizingRef.current && frameRef.current) {
        const width = parseInt(frameRef.current.style.width || '0', 10);
        const height = parseInt(frameRef.current.style.height || '0', 10);
        resizeContainer(container.id, { width, height });
      }
      if (draggingRef.current || resizingRef.current) {
        focusWindow(activeWindow.id);
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
  }, [container.id, activeWindow.id, moveContainer, resizeContainer, focusWindow]);

  const windowState: WindowState = {
    id: activeWindow.id,
    type: activeWindow.type,
    title: activeWindow.title,
    position: container.position,
    size: container.size,
    prevPosition: container.prevPosition,
    prevSize: container.prevSize,
    isMinimized: activeWindow.isMinimized,
    isMaximized: !!container.snapRegion,
    isFocused: activeWindow.isFocused,
    isVisible: true,
    zIndex: container.zIndex,
    config: activeWindow.config,
    createdAt: activeWindow.createdAt,
    updatedAt: activeWindow.updatedAt,
  };

  return (
    <motion.div
      ref={frameRef}
      data-window-frame
      data-container-id={container.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      style={{
        position: 'absolute',
        left: container.position.x,
        top: container.position.y,
        width: container.size.width,
        height: container.size.height,
        zIndex: container.zIndex,
        minWidth: `${MIN_CONTAINER_WIDTH}px`,
        minHeight: `${MIN_CONTAINER_HEIGHT}px`,
        willChange: 'transform',
      }}
      onMouseDown={(e) => { e.stopPropagation(); focusWindow(activeWindow.id); }}
    >
      {/* Outer Shell (Doppelrand) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: 1,
          background: isActive ? theme.colors.accentGlow08 : 'transparent',
          borderRadius: 12,
          boxShadow: isActive
            ? `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${theme.colors.accentGlow25}, 0 0 40px ${theme.colors.accentGlow12}`
            : `0 10px 40px rgba(0,0,0,0.5), 0 0 10px ${theme.colors.accentGlow08}`,
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <CornerDecor position="tl" isFocused={isActive} size={12} />
        <CornerDecor position="tr" isFocused={isActive} size={12} />
        <CornerDecor position="bl" isFocused={isActive} size={12} />
        <CornerDecor position="br" isFocused={isActive} size={12} />

        {/* Inner Core */}
        <div
          style={{
            position: 'absolute',
            inset: 1,
            borderRadius: 11,
            border: `0.5px solid ${isActive ? theme.colors.accentDim15 : theme.colors.borderDefault}`,
            boxShadow: `inset 0 0 0 1px ${theme.colors.accentGlow10}`,
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            background: theme.colors.bgSecondary + 'b0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Title Bar */}
          <div
            style={{
              height: 32,
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              background: isActive
                ? `repeating-linear-gradient(
                    0deg,
                    ${theme.colors.accentGlow06} 0px,
                    ${theme.colors.accentGlow06} 1px,
                    transparent 1px,
                    transparent 2px
                  ), ${theme.colors.accentGlow04}`
                : 'transparent',
              borderBottom: `1px solid ${isActive ? theme.colors.accentDim15 : 'rgba(255,255,255,0.03)'}`,
              cursor: 'move',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseDown={handleTitleMouseDown}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 3,
                  height: 14,
                  borderRadius: 1,
                  background: isActive ? accent : theme.colors.textTertiary,
                  opacity: isActive ? 1 : 0.3,
                  boxShadow: isActive ? `0 0 6px ${accentGlow}` : 'none',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 3,
                  color: isActive ? accent : theme.colors.textTertiary,
                  fontFamily: theme.font.mono,
                  opacity: isActive ? 1 : 0.6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  textShadow: isActive ? `0 0 8px ${accentGlow}` : 'none',
                  transition: 'text-shadow 0.3s ease',
                }}
              >
                {activeWindow.title}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WindowControlButton
                onClick={() => useVioStore.getState().toggleMinimizeWindow(activeWindow.id)}
                label="−"
                theme={theme}
              />
              <WindowControlButton
                onClick={() => container.snapRegion ? unsnapContainer(container.id) : snapContainer(container.id, 'left-half')}
                label={container.snapRegion ? '❐' : '□'}
                theme={theme}
              />
              <WindowControlButton
                onClick={() => useVioStore.getState().closeWindow(activeWindow.id)}
                label="×"
                theme={theme}
              />
            </div>
          </div>

          {/* Content area */}
          <div style={{ padding: 12, overflow: 'auto', flex: 1 }}>
            <WindowContent window={windowState} />
          </div>
        </div>
      </div>

      {/* Resize handles — outside inner core so they extend past the border */}
      {!container.snapRegion && (
        <>
          <ResizeHandle dir="n" onMouseDown={handleResizeMouseDown} theme={theme} />
          <ResizeHandle dir="s" onMouseDown={handleResizeMouseDown} theme={theme} />
          <ResizeHandle dir="e" onMouseDown={handleResizeMouseDown} theme={theme} />
          <ResizeHandle dir="w" onMouseDown={handleResizeMouseDown} theme={theme} />
          <ResizeHandle dir="ne" onMouseDown={handleResizeMouseDown} theme={theme} />
          <ResizeHandle dir="nw" onMouseDown={handleResizeMouseDown} theme={theme} />
          <ResizeHandle dir="se" onMouseDown={handleResizeMouseDown} theme={theme} />
          <ResizeHandle dir="sw" onMouseDown={handleResizeMouseDown} theme={theme} />
        </>
      )}
    </motion.div>
  );
}

/* ResizeHandle subcomponent */
function ResizeHandle({
  dir,
  onMouseDown,
  theme,
}: {
  dir: string;
  onMouseDown: (e: React.MouseEvent, dir: string) => void;
  theme: import('../../types').ThemeConfig;
}) {
  const positions: Record<string, React.CSSProperties> = {
    n: { position: 'absolute', top: -4, left: 8, right: 8, height: 8, cursor: 'ns-resize' },
    s: { position: 'absolute', bottom: -4, left: 8, right: 8, height: 8, cursor: 'ns-resize' },
    e: { position: 'absolute', right: -4, top: 8, bottom: 8, width: 8, cursor: 'ew-resize' },
    w: { position: 'absolute', left: -4, top: 8, bottom: 8, width: 8, cursor: 'ew-resize' },
    ne: { position: 'absolute', top: -4, right: -4, width: 14, height: 14, cursor: 'nesw-resize' },
    nw: { position: 'absolute', top: -4, left: -4, width: 14, height: 14, cursor: 'nwse-resize' },
    se: { position: 'absolute', bottom: -4, right: -4, width: 14, height: 14, cursor: 'nwse-resize' },
    sw: { position: 'absolute', bottom: -4, left: -4, width: 14, height: 14, cursor: 'nesw-resize' },
  };

  return (
    <div
      style={positions[dir]}
      onMouseDown={(e) => onMouseDown(e, dir)}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'transparent',
          transition: 'background 0.15s ease',
          borderRadius: 2,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = theme.colors.accentGlow15;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
        }}
      />
    </div>
  );
}

/* WindowControlButton subcomponent */
function WindowControlButton({ onClick, label, theme }: { onClick: () => void; label: string; theme: import('../../types').ThemeConfig }) {
  return (
    <motion.button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      style={{
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        cursor: 'default',
        borderRadius: 4,
        color: theme.colors.textTertiary,
        fontSize: 10,
        fontFamily: theme.font.mono,
        padding: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = theme.colors.accentGlow10 ?? '';
        (e.currentTarget as HTMLButtonElement).style.color = theme.colors.accent;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.color = theme.colors.textTertiary;
      }}
    >
      {label}
    </motion.button>
  );
}
