// src/lib/geometry.ts

import type { Vector2D, Size2D, SnapRegion } from '../core/types';
import { TASKBAR_HEIGHT } from '../core/constants';

/** Distance from screen edge to trigger snap */
export const SNAP_TRIGGER_DISTANCE = 20;

/** Minimum container size */
export const MIN_CONTAINER_WIDTH = 320;
export const MIN_CONTAINER_HEIGHT = 200;

export function detectSnapRegion(
  position: Vector2D,
  size: Size2D,
  monitorBounds: { width: number; height: number }
): SnapRegion | null {
  const { x, y } = position;
  const { width, height } = monitorBounds;

  const nearLeft = x <= SNAP_TRIGGER_DISTANCE;
  const nearRight = x + size.width >= width - SNAP_TRIGGER_DISTANCE;
  const nearTop = y <= SNAP_TRIGGER_DISTANCE;
  const nearBottom = y + size.height >= height - TASKBAR_HEIGHT - SNAP_TRIGGER_DISTANCE;

  if (nearLeft && nearTop) return 'top-left';
  if (nearRight && nearTop) return 'top-right';
  if (nearLeft && nearBottom) return 'bottom-left';
  if (nearRight && nearBottom) return 'bottom-right';
  if (nearLeft) return 'left-half';
  if (nearRight) return 'right-half';
  if (nearTop) return 'top-half';
  if (nearBottom) return 'bottom-half';

  return null;
}

export function computeSnapGeometry(
  region: SnapRegion,
  monitorBounds: { width: number; height: number }
): { position: Vector2D; size: Size2D } {
  const { width, height } = monitorBounds;
  const workHeight = height - TASKBAR_HEIGHT;

  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(workHeight / 2);

  switch (region) {
    case 'left-half':
      return { position: { x: 0, y: 0 }, size: { width: halfW, height: workHeight } };
    case 'right-half':
      return { position: { x: halfW, y: 0 }, size: { width: width - halfW, height: workHeight } };
    case 'top-half':
      return { position: { x: 0, y: 0 }, size: { width, height: halfH } };
    case 'bottom-half':
      return { position: { x: 0, y: halfH }, size: { width, height: workHeight - halfH } };
    case 'top-left':
      return { position: { x: 0, y: 0 }, size: { width: halfW, height: halfH } };
    case 'top-right':
      return { position: { x: halfW, y: 0 }, size: { width: width - halfW, height: halfH } };
    case 'bottom-left':
      return { position: { x: 0, y: halfH }, size: { width: halfW, height: workHeight - halfH } };
    case 'bottom-right':
      return { position: { x: halfW, y: halfH }, size: { width: width - halfW, height: workHeight - halfH } };
  }
}

export function clampPosition(
  position: Vector2D,
  size: Size2D,
  monitorBounds: { width: number; height: number }
): Vector2D {
  return {
    x: Math.max(0, Math.min(position.x, monitorBounds.width - size.width)),
    y: Math.max(0, Math.min(position.y, monitorBounds.height - TASKBAR_HEIGHT - size.height)),
  };
}

export function getCascadeOffset(index: number): Vector2D {
  const offset = (index % 5) * 30;
  return { x: 80 + offset, y: 60 + offset };
}
