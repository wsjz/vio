// src/hooks/useDragState.ts

import { useCallback } from 'react';
import { useUiStore } from '../core/stores/uiStore';
import { useVioStore } from '../core/stores/vioStore';
import type { Vector2D, SnapRegion } from '../core/types';

export function useDragState() {
  const { drag, startDrag, updateDrag, endDrag } = useUiStore();
  const moveContainer = useVioStore((s) => s.moveContainer);
  const snapContainer = useVioStore((s) => s.snapContainer);

  const handleDragStart = useCallback(
    (containerId: string, position: Vector2D, size: { width: number; height: number }) => {
      startDrag(containerId, position, size);
    },
    [startDrag]
  );

  const handleDragMove = useCallback(
    (offset: Vector2D) => {
      updateDrag(offset);
    },
    [updateDrag]
  );

  const handleDragEnd = useCallback(
    (containerId: string, finalPosition: Vector2D, snapRegion?: string) => {
      endDrag();

      const validRegions: SnapRegion[] = [
        'left-half', 'right-half', 'top-half', 'bottom-half',
        'top-left', 'top-right', 'bottom-left', 'bottom-right',
      ];

      if (snapRegion && validRegions.includes(snapRegion as SnapRegion)) {
        snapContainer(containerId, snapRegion as SnapRegion);
      } else {
        moveContainer(containerId, finalPosition);
      }
    },
    [endDrag, moveContainer, snapContainer]
  );

  return {
    drag,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}
