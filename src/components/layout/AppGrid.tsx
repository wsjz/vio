import { useRef, useState, useCallback, useEffect } from 'react';
import type { WindowState } from '../../types';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { useWindowStore } from '../../core/window-manager/windowStore';

interface AppGridProps {
  windows: WindowState[];
  visible: boolean;
  onClose: () => void;
}

export function AppGrid({ windows, visible, onClose }: AppGridProps) {
  const { theme } = useThemeStore();
  const arrangeWindowsByOrder = useWindowStore((s) => s.arrangeWindowsByOrder);

  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    if (visible) setOrder(windows.map((w) => w.id));
  }, [visible, windows]);

  const dragRef = useRef<{
    fromIdx: number;
    ghost: HTMLDivElement;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  const winMap = new Map(windows.map((w) => [w.id, w]));

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, idx: number) => {
      e.preventDefault();
      e.stopPropagation();

      const win = winMap.get(order[idx]);
      if (!win) return;

      const rect = {
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
      };

      const ghost = document.createElement('div');
      ghost.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        z-index: 9999;
        opacity: 0.9;
        pointer-events: none;
        transform: scale(1.05);
        transition: none;
        border-radius: 8px;
        box-shadow: 0 0 30px ${theme.colors.accentGlow30};
        border: 1px solid ${theme.colors.accent};
        background: ${theme.colors.bgSecondary + 'ee'};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        cursor: grabbing;
      `;

      ghost.innerHTML = `
        <div style="width:44px;height:44px;border-radius:12px;background:${theme.colors.accentGlow10};display:flex;align-items:center;justify-content:center;font-size:22px;color:${theme.colors.accent};font-family:${theme.font.mono};">${getTypeIcon(win.type)}</div>
        <div style="font-size:12px;font-weight:500;color:${theme.colors.textPrimary};font-family:${theme.font.ui};text-align:center;max-width:${rect.width - 40}px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${win.title}</div>
        <div style="font-size:10px;color:${theme.colors.textTertiary};font-family:${theme.font.mono};letter-spacing:1px;text-transform:uppercase;">${win.type}</div>
      `;

      document.body.appendChild(ghost);

      dragRef.current = {
        fromIdx: idx,
        ghost,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };
      setDraggingIdx(idx);
      setDropIdx(idx);

      const onMove = (ev: MouseEvent) => {
        const d = dragRef.current;
        if (!d) return;
        d.ghost.style.left = `${ev.clientX - d.offsetX}px`;
        d.ghost.style.top = `${ev.clientY - d.offsetY}px`;

        // Find nearest window slot by center distance
        let bestIdx = idx;
        let bestDist = Infinity;
        for (let i = 0; i < order.length; i++) {
          const w = winMap.get(order[i]);
          if (!w) continue;
          const cx = w.position.x + w.size.width / 2;
          const cy = w.position.y + w.size.height / 2;
          const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        }
        if (bestIdx !== dropIdx) setDropIdx(bestIdx);
      };

      const onUp = () => {
        const d = dragRef.current;
        if (!d) return;
        document.body.removeChild(d.ghost);

        const from = d.fromIdx;
        const to = dropIdx ?? from;
        if (from !== to) {
          setOrder((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            // Apply new order as tiled layout
            requestAnimationFrame(() => arrangeWindowsByOrder(next));
            return next;
          });
        }

        dragRef.current = null;
        setDraggingIdx(null);
        setDropIdx(null);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [dropIdx, order, arrangeWindowsByOrder, theme, winMap]
  );

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'fixed',
          top: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 13,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: theme.colors.accentDim,
          fontFamily: theme.font.mono,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        Window Grid — Drag to reorder
      </div>

      {/* Done button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 32px',
          background: theme.colors.bgSecondary + 'ee',
          border: `1px solid ${theme.colors.accentDim}`,
          borderRadius: 4,
          color: theme.colors.accent,
          fontFamily: theme.font.mono,
          fontSize: 12,
          cursor: 'default',
          letterSpacing: 1,
          zIndex: 101,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme.colors.accentGlow10;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme.colors.bgSecondary + 'ee';
        }}
      >
        Done (Esc / Enter)
      </button>

      {/* Slots — positioned over each window */}
      {order.map((id, i) => {
        const win = winMap.get(id);
        if (!win) return null;

        const isDragged = draggingIdx === i;
        const isDropTarget = draggingIdx !== null && dropIdx === i && i !== draggingIdx;

        if (isDragged) {
          return (
            <div
              key={`ph-${id}`}
              data-grid-slot
              style={{
                position: 'absolute',
                left: win.position.x,
                top: win.position.y,
                width: win.size.width,
                height: win.size.height,
                borderRadius: 8,
                border: `2px dashed ${theme.colors.accentDim}`,
                background: 'transparent',
                pointerEvents: 'none',
              }}
            />
          );
        }

        if (isDropTarget) {
          return (
            <div
              key={`target-${id}`}
              data-grid-slot
              style={{
                position: 'absolute',
                left: win.position.x,
                top: win.position.y,
                width: win.size.width,
                height: win.size.height,
                borderRadius: 8,
                border: `2px solid ${theme.colors.accent}`,
                background: theme.colors.accentGlow06,
                boxShadow: `0 0 20px ${theme.colors.accentGlow15}`,
                pointerEvents: 'none',
              }}
            />
          );
        }

        return (
          <div
            key={id}
            data-grid-slot
            onMouseDown={(e) => handleMouseDown(e, i)}
            style={{
              position: 'absolute',
              left: win.position.x,
              top: win.position.y,
              width: win.size.width,
              height: win.size.height,
              borderRadius: 8,
              border: `1px solid ${theme.colors.accentDim}`,
              background: theme.colors.bgSecondary + '66',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'grab',
              userSelect: 'none',
              transition: 'box-shadow 0.2s, border-color 0.2s',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.accentDim50;
              e.currentTarget.style.boxShadow = `0 0 16px ${theme.colors.accentGlow20}`;
              e.currentTarget.style.background = theme.colors.bgSecondary + 'aa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.accentDim;
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
              e.currentTarget.style.background = theme.colors.bgSecondary + '66';
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: theme.colors.accentGlow10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: theme.colors.accent,
                fontFamily: theme.font.mono,
              }}
            >
              {getTypeIcon(win.type)}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: theme.colors.textPrimary,
                fontFamily: theme.font.ui,
                textAlign: 'center',
                maxWidth: win.size.width - 32,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {win.title}
            </div>
            <div
              style={{
                fontSize: 9,
                color: theme.colors.textTertiary,
                fontFamily: theme.font.mono,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {win.type}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    'system-monitor': '◉',
    'shell': '⟩',
    'file-manager': '▤',
    'network-map': '◎',
    'code-editor': '✎',
    'map': '⌖',
    'media-player': '▶',
    'viewer-3d': '◈',
    'log-viewer': '≡',
    'settings': '⚙',
    'opencli': '⌘',
    'widget-clock': '◷',
  };
  return icons[type] ?? '□';
}
