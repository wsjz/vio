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
