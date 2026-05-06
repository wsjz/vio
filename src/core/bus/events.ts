// src/core/bus/events.ts

export type VioEvent =
  | 'window:created'
  | 'window:focused'
  | 'window:closed'
  | 'container:snapped'
  | 'container:unsnapped'
  | 'container:moved'
  | 'container:resized'
  | 'workspace:switched'
  | 'workspace:containerMoved'
  | 'workspace:renamed'
  | 'monitor:changed'
  | 'layout:changed';
