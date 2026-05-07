// src/lib/easings.ts
// Centralized animation easing and duration constants

export const easings = {
  springSnappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
  springGentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  springBounce: { type: 'spring' as const, stiffness: 300, damping: 20 },
  cubicEnter: [0.32, 0.72, 0, 1] as const,
  cubicExit: [0.4, 0, 1, 1] as const,
  cubicBounce: [0.34, 1.56, 0.64, 1] as const,
  cubicSmooth: [0.22, 1, 0.36, 1] as const,
} as const;

export const durations = {
  micro: 0.15,
  state: 0.3,
  structural: 0.5,
  ambient: 2.0,
} as const;
