import type { TerminalType } from '../../types';

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
  const MIN_WIDTH = 520;
  const MIN_HEIGHT = 400;
  const MAX_COLS = 4;
  const visible = windows.filter((w) => w.type !== 'widget-clock');
  const count = visible.length;
  if (count === 0) return [];

  // Determine columns: never exceed MAX_COLS, always respect MIN_WIDTH
  let cols = Math.min(count, MAX_COLS, Math.max(1, Math.floor((screenW - gap) / (MIN_WIDTH + gap))));
  let rows = Math.ceil(count / cols);

  // If rows would push height below MIN_HEIGHT, try fewer columns first
  while (rows > 1 && Math.floor((screenH - gap * (rows + 1)) / rows) < MIN_HEIGHT && cols > 1) {
    cols--;
    rows = Math.ceil(count / cols);
  }

  const cellW = Math.max(MIN_WIDTH, Math.floor((screenW - gap * (cols + 1)) / cols));
  const cellH = Math.max(MIN_HEIGHT, Math.floor((screenH - gap * (rows + 1)) / rows));

  return visible.map((w, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      id: w.id,
      position: {
        x: gap + col * (cellW + gap),
        y: gap + row * (cellH + gap),
      },
      size: {
        width: cellW,
        height: cellH,
      },
    };
  });
}
