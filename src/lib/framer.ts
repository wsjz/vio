// src/lib/framer.ts

import type { Transition } from 'framer-motion';

export const snapSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const workspaceSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

export const openSpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

export const closeTransition: Transition = {
  duration: 0.15,
  ease: 'easeIn',
};

export const windowOpenVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

export const appGridContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export const appGridCardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
};
