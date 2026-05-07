// src/lib/animations.ts
// Reusable Framer Motion variants

import { easings, durations } from './easings';
import type { Variants } from 'framer-motion';

export const holographicOpen: Variants = {
  initial: {
    clipPath: 'inset(49.5% 0% 49.5% 0%)',
    opacity: 0,
    scale: 0.98,
  },
  animate: {
    clipPath: 'inset(0% 0% 0% 0%)',
    opacity: 1,
    scale: 1,
    transition: {
      clipPath: { duration: 0.35, ease: easings.cubicEnter },
      opacity: { duration: 0.2 },
      scale: { type: 'spring', stiffness: 400, damping: 25, delay: 0.3 },
    },
  },
  exit: {
    clipPath: 'inset(49.5% 0% 49.5% 0%)',
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.25, ease: easings.cubicExit },
  },
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.micro, ease: easings.cubicEnter },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.1, ease: easings.cubicExit },
  },
};

export const slideFromRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: durations.state, ease: easings.cubicEnter },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: durations.state, ease: easings.cubicExit },
  },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: easings.cubicExit },
  },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: easings.cubicEnter },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.2, ease: easings.cubicExit },
  },
};
