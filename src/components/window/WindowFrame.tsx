import { useRef, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Container, WindowState } from '../../core/types';
import { WindowContent } from './WindowContent';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { useVioStore } from '../../core/stores/vioStore';
import { MIN_CONTAINER_WIDTH, MIN_CONTAINER_HEIGHT } from '../../lib/geometry';
import { windowOpenVariants } from '../../lib/framer';

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

  // Build WindowState for terminal compatibility
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
      initial="initial"
      animate="animate"
      exit="exit"
      variants={windowOpenVariants}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute',
        overflow: 'hidden',
        left: container.position.x,
        top: container.position.y,
        width: container.size.width,
        height: container.size.height,
        zIndex: container.zIndex,
        background: theme.colors.bgSecondary + 'b0',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${isActive ? theme.colors.accentDim50 : theme.colors.borderDefault}`,
        borderRadius: '4px',
        boxShadow: isActive
          ? `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${theme.colors.accentGlow25}, 0 0 40px ${theme.colors.accentGlow12}, inset 0 0 0 1px ${theme.colors.accentGlow10}`
          : `0 10px 40px rgba(0,0,0,0.5), 0 0 10px ${theme.colors.accentGlow08}`,
        minWidth: `${MIN_CONTAINER_WIDTH}px`,
        minHeight: `${MIN_CONTAINER_HEIGHT}px`,
        willChange: 'transform',
      }}
      onMouseDown={() => focusWindow(activeWindow.id)}
    >
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
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
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
          >
            {activeWindow.title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WindowControlButton onClick={() => useVioStore.getState().toggleMinimizeWindow(activeWindow.id)} label="−" theme={theme} />
          <WindowControlButton onClick={() => container.snapRegion ? unsnapContainer(container.id) : snapContainer(container.id, 'left-half')} label={container.snapRegion ? '❐' : '□'} theme={theme} />
          <WindowControlButton onClick={() => useVioStore.getState().closeWindow(activeWindow.id)} label="×" theme={theme} />
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: 12, overflow: 'auto', height: 'calc(100% - 28px)' }}>
        <WindowContent window={windowState} />
      </div>

      {/* Resize handles */}
      {!container.snapRegion && (
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
    </motion.div>
  );
}

function WindowControlButton({ onClick, label, theme }: { onClick: () => void; label: string; theme: import('../../types').ThemeConfig }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
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
    </button>
  );
}
