// src/components/layout/AppGrid.tsx
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { useVioStore } from '../../core/stores/vioStore';
import { staggerContainer, staggerItem } from '../../lib/animations';

interface AppGridProps {
  visible: boolean;
  onClose: () => void;
}

const CARD_W = 280;
const CARD_H = 200;
const GAP = 16;
const TOP_OFFSET = 80;
const BOTTOM_OFFSET = 80;

export function AppGrid({ visible, onClose }: AppGridProps) {
  const { theme } = useThemeStore();
  const { monitors, switchWorkspace, focusWindow } = useVioStore();

  const containers = monitors.flatMap((m) =>
    m.workspaces
      .filter((w) => w.isActive)
      .flatMap((w) =>
        w.containers
          .filter((c) => !c.windows.every((win) => win.isMinimized))
          .map((c) => ({ ...c, workspaceId: w.id, monitorId: m.id }))
      )
  );

  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    if (visible) setOrder(containers.map((c) => c.id));
  }, [visible, containers.map((c) => c.id).join(',')]);

  // Drag state — use refs for values needed inside event listeners (avoids stale closure)
  const dragRef = useRef<{
    fromIdx: number;
    ghost: HTMLDivElement;
    offsetX: number;
    offsetY: number;
    hasDragged: boolean;
    currentDropIdx: number;
  } | null>(null);

  // UI-only state (for rendering placeholder / drop target visuals)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  // Keyboard: Esc to close
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  // Compute grid layout
  const gridCols = Math.max(1, Math.floor((window.innerWidth - GAP * 2) / (CARD_W + GAP)));
  const gridRows = Math.max(1, Math.floor((window.innerHeight - TOP_OFFSET - BOTTOM_OFFSET) / (CARD_H + GAP)));
  const perPage = gridCols * gridRows;
  const totalPages = Math.max(1, Math.ceil(order.length / perPage));
  const [page, setPage] = useState(0);
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = order.slice(currentPage * perPage, (currentPage + 1) * perPage);

  const containerMap = new Map(containers.map((c) => [c.id, c]));

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, idx: number) => {
      e.preventDefault();
      e.stopPropagation();

      const containerId = pageItems[idx];
      const container = containerMap.get(containerId);
      if (!container) return;

      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();

      const ghost = document.createElement('div');
      ghost.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        z-index: 9999;
        opacity: 0.85;
        pointer-events: none;
        transform: scale(1.05);
        transition: none;
        border-radius: 8px;
        box-shadow: 0 0 40px ${theme.colors.accentGlow30};
        border: 2px solid ${theme.colors.accent};
        background: ${theme.colors.bgSecondary + 'ee'};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        cursor: grabbing;
      `;

      const activeWin = container.windows.find((w) => w.id === container.activeWindowId) || container.windows[0];
      ghost.innerHTML = `
        <div style="width:44px;height:44px;border-radius:12px;background:${theme.colors.accentGlow10};display:flex;align-items:center;justify-content:center;font-size:22px;color:${theme.colors.accent};font-family:${theme.font.mono};">${getTypeIcon(activeWin?.type || '')}</div>
        <div style="font-size:12px;font-weight:500;color:${theme.colors.textPrimary};font-family:${theme.font.ui};text-align:center;max-width:${rect.width - 40}px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${activeWin?.title || ''}</div>
        <div style="font-size:10px;color:${theme.colors.textTertiary};font-family:${theme.font.mono};letter-spacing:1px;text-transform:uppercase;">${activeWin?.type || ''}</div>
      `;

      document.body.appendChild(ghost);

      dragRef.current = {
        fromIdx: idx,
        ghost,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        hasDragged: false,
        currentDropIdx: idx,
      };
      setDraggingIdx(idx);
      setDropIdx(idx);

      const onMove = (ev: MouseEvent) => {
        const d = dragRef.current;
        if (!d) return;
        d.hasDragged = true;
        d.ghost.style.left = `${ev.clientX - d.offsetX}px`;
        d.ghost.style.top = `${ev.clientY - d.offsetY}px`;

        // Find nearest slot by center distance
        let bestIdx = idx;
        let bestDist = Infinity;
        const slots = document.querySelectorAll('[data-grid-slot]');
        slots.forEach((slot, i) => {
          const r = slot.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        });
        if (bestIdx !== d.currentDropIdx) {
          d.currentDropIdx = bestIdx;
          setDropIdx(bestIdx);
        }
      };

      const onUp = () => {
        const d = dragRef.current;
        if (!d) return;
        document.body.removeChild(d.ghost);

        const from = d.fromIdx;
        const to = d.currentDropIdx;
        if (from !== to) {
          setOrder((prev) => {
            const pageStart = currentPage * perPage;
            const pageEnd = Math.min(pageStart + perPage, prev.length);
            const pageOrder = prev.slice(pageStart, pageEnd);
            const [moved] = pageOrder.splice(from, 1);
            pageOrder.splice(to, 0, moved);
            const next = [
              ...prev.slice(0, pageStart),
              ...pageOrder,
              ...prev.slice(pageEnd),
            ];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageItems, containerMap, theme, currentPage, perPage]
  );

  const handleClickCard = (containerId: string) => {
    if (dragRef.current?.hasDragged) return;
    const container = containerMap.get(containerId);
    if (!container) return;
    switchWorkspace(container.monitorId, container.workspaceId);
    const activeWin = container.windows.find((w) => w.id === container.activeWindowId);
    if (activeWin) focusWindow(activeWin.id);
    onClose();
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: theme.colors.bgPrimary + 'ee',
        backdropFilter: 'blur(8px)',
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'fixed',
          top: 24,
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
        Window Grid — Drag to reorder · Click to focus
      </div>

      {/* Cards grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          position: 'fixed',
          top: TOP_OFFSET,
          left: 0,
          right: 0,
          bottom: BOTTOM_OFFSET,
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          justifyContent: 'center',
          gap: GAP,
          padding: GAP,
          overflow: 'auto',
        }}
      >
        {pageItems.map((containerId, i) => {
          const container = containerMap.get(containerId);
          if (!container) return null;

          const activeWin = container.windows.find((w) => w.id === container.activeWindowId) || container.windows[0];
          const isDragged = draggingIdx === i;
          const isDropTarget = draggingIdx !== null && dropIdx === i && i !== draggingIdx;

          if (isDragged) {
            return (
              <div
                key={`ph-${containerId}`}
                data-grid-slot
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  borderRadius: 8,
                  border: `2px dashed ${theme.colors.accentDim}`,
                  background: 'transparent',
                  pointerEvents: 'none',
                  flexShrink: 0,
                }}
              />
            );
          }

          if (isDropTarget) {
            return (
              <div
                key={`target-${containerId}`}
                data-grid-slot
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  borderRadius: 8,
                  border: `2px solid ${theme.colors.accent}`,
                  background: theme.colors.accentGlow06,
                  boxShadow: `0 0 20px ${theme.colors.accentGlow15}`,
                  pointerEvents: 'none',
                  flexShrink: 0,
                }}
              />
            );
          }

          return (
            <motion.div
              key={containerId}
              variants={staggerItem}
              data-grid-slot
              onMouseDown={(e) => handleMouseDown(e, i)}
              onClick={() => handleClickCard(containerId)}
              style={{
                width: CARD_W,
                height: CARD_H,
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
                transition: 'box-shadow 0.2s, border-color 0.2s, background 0.2s',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                flexShrink: 0,
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
                {getTypeIcon(activeWin?.type || '')}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: theme.colors.textPrimary,
                  fontFamily: theme.font.ui,
                  textAlign: 'center',
                  maxWidth: CARD_W - 32,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeWin?.title || 'Untitled'}
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
                {activeWin?.type || ''}
              </div>
              {container.windows.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: 10,
                    color: theme.colors.accent,
                    background: theme.colors.accentGlow10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontFamily: theme.font.mono,
                  }}
                >
                  {container.windows.length} tabs
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Pagination dots */}
      {totalPages > 1 && (
        <div
          style={{
            position: 'fixed',
            bottom: 40,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: 'none',
                background: i === currentPage ? theme.colors.accent : theme.colors.accentDim,
                cursor: 'default',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      )}

      {/* Done button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          bottom: 60,
          right: 40,
          padding: '8px 24px',
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
        Done (Esc)
      </button>
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
