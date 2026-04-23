import type { TerminalType } from '../../types';
import { MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from '../constants';

export interface TiledLayout {
  type: TerminalType;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

const ALL_TERMINALS: TerminalType[] = [
  'system-monitor',
  'shell',
  'log-viewer',
  'file-manager',
  'network-map',
  'code-editor',
  'map',
  'media-player',
  'viewer-3d',
  'widget-clock',
  'settings',
];

export function computeTiledLayout(
  screenW: number,
  screenH: number
): TiledLayout[] {
  const gap = 8;
  const count = ALL_TERMINALS.length;

  // Compute grid: prefer wider layout for typical screens
  let cols = Math.ceil(Math.sqrt(count * 1.4));
  let rows = Math.ceil(count / cols);

  // Adjust if too many rows
  while (rows > cols + 1 && cols < count) {
    cols++;
    rows = Math.ceil(count / cols);
  }

  const cellW = Math.floor((screenW - gap * (cols + 1)) / cols);
  const cellH = Math.floor((screenH - gap * (rows + 1)) / rows);

  const layouts: TiledLayout[] = [];

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    layouts.push({
      type: ALL_TERMINALS[i],
      position: {
        x: gap + col * (cellW + gap),
        y: gap + row * (cellH + gap),
      },
      size: {
        width: cellW,
        height: cellH,
      },
    });
  }

  return layouts;
}

export function computeArrangedLayout(
  windows: { id: string; type: TerminalType }[],
  screenW: number,
  screenH: number
): { id: string; position: { x: number; y: number }; size: { width: number; height: number } }[] {
  const gap = 16;
  const visible = windows.filter((w) => w.type !== 'widget-clock');
  const n = visible.length;
  if (n === 0) return [];

  // Simple grid: choose columns based on screen aspect ratio
  // This ensures all n windows get a layout slot
  let cols = Math.round(Math.sqrt(n * (screenW / screenH)));
  cols = Math.max(1, Math.min(cols, n));
  let rows = Math.ceil(n / cols);

  const cellW = Math.floor((screenW - gap * (cols + 1)) / cols);
  const cellH = Math.floor((screenH - gap * (rows + 1)) / rows);

  return visible.map((w, i) => ({
    id: w.id,
    position: {
      x: gap + (i % cols) * (cellW + gap),
      y: gap + Math.floor(i / cols) * (cellH + gap),
    },
    size: {
      width: Math.max(MIN_WINDOW_WIDTH, cellW),
      height: Math.max(MIN_WINDOW_HEIGHT, cellH),
    },
  }));
}
