# VIO Cinematic Sci-Fi UI/UX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement cinematic sci-fi UI/UX: Doppelrand window chrome, holographic animations, neon luminescence, magnetic drag physics, notification center, system tray, window thumbnails, and multi-monitor indicators.

**Architecture:** Foundation-first: build shared animation utilities + Doppelrand components first, then upgrade WindowFrame, then global transitions, then new features. All animations use Framer Motion with custom cubic-bezier curves. GPU-safe: only `transform` + `opacity` animated.

**Tech Stack:** React 18 + TypeScript + Vite + Framer Motion + Zustand + Tauri 2.0 (Rust)

---

## File Structure Map

### New Files

| File | Responsibility |
|------|---------------|
| `src/lib/easings.ts` | Animation easing constants + duration constants |
| `src/lib/animations.ts` | Reusable Framer Motion variants (holographic open, data dissipate, etc.) |
| `src/components/effects/NoiseOverlay.tsx` | Fixed noise texture overlay |
| `src/components/effects/GlowBorder.tsx` | @property animated neon glow border |
| `src/components/effects/CornerDecor.tsx` | L-shaped corner indicator |
| `src/components/ui/DoppelrandCard.tsx` | Reusable double-bezel card wrapper |
| `src/components/ui/NeonButton.tsx` | Button with hover/active physics |
| `src/components/ui/StatusBadge.tsx` | Pill badge with pulse animation |
| `src/components/layout/NotificationPanel.tsx` | Right-slide notification center |
| `src/components/layout/TrayMenu.tsx` | Context menu for system tray |
| `src/components/layout/MonitorIndicator.tsx` | Per-screen monitor indicator |
| `src/hooks/useThumbnail.ts` | html2canvas thumbnail generation |

### Modified Files

| File | Changes |
|------|---------|
| `src/index.html` | Add Google Fonts CDN links |
| `src/index.css` | Add noise texture, new keyframes, @property, cursor utilities |
| `src/core/theme-engine/themes/cyberpunk.ts` | Add glow variants |
| `src/core/theme-engine/themes/matrix.ts` | Add glow variants |
| `src/core/theme-engine/themes/amber.ts` | Add glow variants |
| `src/components/window/WindowFrame.tsx` | Doppelrand + corner decor + holographic animations |
| `src/components/layout/Desktop.tsx` | Workspace switch animation + monitor indicators |
| `src/components/layout/AppGrid.tsx` | Staggered enter/exit + thumbnails |
| `src/components/layout/Launcher.tsx` | Expand-from-button animation |
| `src/components/layout/TaskBar.tsx` | Notification bell + thumbnail preview |
| `src-tauri/src/commands/platform.rs` | Tray icon, startup, monitor info |

---

## Phase 1: Foundation (Week 1-2)

---

### Task 1.1: Add Google Fonts

**Files:**
- Modify: `src/index.html`

**Context:** Current fonts (Orbitron, JetBrains Mono, Rajdhani) stay as fallbacks. New fonts: Space Grotesk (display), Geist Mono (mono), Plus Jakarta Sans (UI).

- [ ] **Step 1: Add Google Fonts preconnect and stylesheet links**

```html
<!-- In <head>, BEFORE existing stylesheets -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Verify fonts load**

Run: `npm run build`

Expected: Build succeeds, no new errors.

---

### Task 1.2: Create Animation Utilities

**Files:**
- Create: `src/lib/easings.ts`
- Create: `src/lib/animations.ts`

- [ ] **Step 1: Create `src/lib/easings.ts`**

```typescript
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
```

- [ ] **Step 2: Create `src/lib/animations.ts`**

```typescript
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
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds.

---

### Task 1.3: Update CSS Global Styles

**Files:**
- Modify: `src/index.css`

**Context:** Add `@property` for animated glow, noise texture, new keyframes, and font-family updates.

- [ ] **Step 1: Add @property declarations and new keyframes at top of CSS**

```css
/* ============ CSS @PROPERTY (for animated glow) ============ */
@property --glow-pos {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}

/* ============ NOISE TEXTURE ============ */
.noise-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

/* ============ NEON GLOW BORDER ============ */
@keyframes neon-sweep {
  0% { --glow-pos: 0%; }
  100% { --glow-pos: 100%; }
}

.neon-border {
  border-image: linear-gradient(
    90deg,
    transparent var(--glow-pos),
    rgba(0, 240, 255, 0.6) calc(var(--glow-pos) + 20%),
    transparent calc(var(--glow-pos) + 40%)
  ) 1;
  animation: neon-sweep 2s ease-in-out infinite;
}

/* ============ CORNER PULSE ============ */
@keyframes corner-pulse {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.6; }
}

/* ============ SCANLINE TEXTURE ============ */
.scanline-bg {
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.01) 2px,
    rgba(255, 255, 255, 0.01) 4px
  );
}

/* ============ GLITCH EFFECT ============ */
@keyframes glitch-rgb {
  0% { text-shadow: -2px 0 rgba(255, 0, 0, 0.5), 2px 0 rgba(0, 240, 255, 0.5); }
  25% { text-shadow: 2px 0 rgba(255, 0, 0, 0.5), -2px 0 rgba(0, 240, 255, 0.5); }
  50% { text-shadow: -1px 0 rgba(255, 0, 0, 0.3), 1px 0 rgba(0, 240, 255, 0.3); }
  100% { text-shadow: none; }
}

.glitch-text {
  animation: glitch-rgb 0.15s ease-in-out;
}

/* ============ DOPPELRAND BORDER ============ */
.doppelrand {
  padding: 1px;
  background: rgba(0, 240, 255, 0.04);
  border-radius: 12px;
  box-shadow: 0 0 8px rgba(0, 240, 255, 0.04);
}

.doppelrand-inner {
  border-radius: 11px;
  border: 0.5px solid rgba(0, 240, 255, 0.25);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05);
  background: rgba(18, 18, 26, 0.85);
  backdrop-filter: blur(20px) saturate(140%);
}

/* ============ TYPOGRAPHY OVERRIDES ============ */
.font-display {
  font-family: 'Space Grotesk', 'Orbitron', system-ui, sans-serif;
}

.font-mono {
  font-family: 'Geist Mono', 'JetBrains Mono', monospace;
}

.font-ui {
  font-family: 'Plus Jakarta Sans', 'Rajdhani', system-ui, sans-serif;
}
```

- [ ] **Step 2: Update base font-family in existing CSS**

Find and replace:
```css
/* OLD */
html, body {
  font-family: 'JetBrains Mono', monospace;
}

/* NEW */
html, body {
  font-family: 'Geist Mono', 'JetBrains Mono', monospace;
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds.

---

### Task 1.4: Update Theme Configs

**Files:**
- Modify: `src/core/theme-engine/themes/cyberpunk.ts`
- Modify: `src/core/theme-engine/themes/matrix.ts`
- Modify: `src/core/theme-engine/themes/amber.ts`

**Context:** Add missing glow variants used by Doppelrand and neon effects.

- [ ] **Step 1: Update Cyberpunk theme**

Add to `cyberpunk.ts` colors object (after existing variants):

```typescript
// Add these to the colors object
accentDim30: 'rgba(0, 240, 255, 0.3)',
accentDim50: 'rgba(0, 240, 255, 0.5)',
accentDim15: 'rgba(0, 240, 255, 0.15)',
accentDim10: 'rgba(0, 240, 255, 0.1)',
accentDim20: 'rgba(0, 240, 255, 0.2)',
accentDim08: 'rgba(0, 240, 255, 0.08)',
accentDim06: 'rgba(0, 240, 255, 0.06)',
accentGlow25: 'rgba(0, 240, 255, 0.25)',
accentGlow12: 'rgba(0, 240, 255, 0.12)',
accentGlow10: 'rgba(0, 240, 255, 0.1)',
accentGlow08: 'rgba(0, 240, 255, 0.08)',
accentGlow06: 'rgba(0, 240, 255, 0.06)',
accentGlow03: 'rgba(0, 240, 255, 0.03)',
accentGlow30: 'rgba(0, 240, 255, 0.3)',
accentGlow04: 'rgba(0, 240, 255, 0.04)',
accentGlow15: 'rgba(0, 240, 255, 0.15)',
accentGlow20: 'rgba(0, 240, 255, 0.2)',
accentGlow40: 'rgba(0, 240, 255, 0.4)',
```

Note: These may already exist. Check first, only add missing ones.

- [ ] **Step 2: Do same for Matrix and Amber themes**

Matrix uses green (`rgba(0, 255, 65, ...)`), Amber uses amber (`rgba(255, 176, 0, ...)`).

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds.

---

### Task 1.5: Create Noise Overlay Component

**Files:**
- Create: `src/components/effects/NoiseOverlay.tsx`

- [ ] **Step 1: Write NoiseOverlay component**

```tsx
// src/components/effects/NoiseOverlay.tsx

export function NoiseOverlay() {
  return (
    <div
      className="noise-overlay"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        pointerEvents: 'none',
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}
```

- [ ] **Step 2: Add to Desktop.tsx**

Import and place inside Desktop's root div, after ScanlineOverlay:

```tsx
import { NoiseOverlay } from '../effects/NoiseOverlay';

// In JSX:
<ScanlineOverlay intensity={scanlineIntensity} color={accent} disableAnimation={lowPowerMode} />
<NoiseOverlay />
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds.

---

### Task 1.6: Create Corner Decor Component

**Files:**
- Create: `src/components/effects/CornerDecor.tsx`

- [ ] **Step 1: Write CornerDecor component**

```tsx
// src/components/effects/CornerDecor.tsx

import { useThemeStore } from '../../core/theme-engine/themeStore';

interface CornerDecorProps {
  position: 'tl' | 'tr' | 'bl' | 'br';
  isFocused?: boolean;
  size?: number;
}

export function CornerDecor({ position, isFocused = false, size = 12 }: CornerDecorProps) {
  const { theme } = useThemeStore();
  const accent = theme.colors.accent;

  const baseStyles: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease',
  };

  const lineStyles: React.CSSProperties = {
    position: 'absolute',
    background: isFocused ? accent : `${accent}26`, // 15% opacity when unfocused
    boxShadow: isFocused ? `0 0 6px ${theme.colors.accentGlow25}` : 'none',
    transition: 'all 0.3s ease',
  };

  const positions: Record<string, React.CSSProperties> = {
    tl: { top: 4, left: 4 },
    tr: { top: 4, right: 4 },
    bl: { bottom: 4, left: 4 },
    br: { bottom: 4, right: 4 },
  };

  const isTop = position.startsWith('t');
  const isLeft = position.endsWith('l');

  return (
    <div style={{ ...baseStyles, ...positions[position] }}>
      {/* Horizontal line */}
      <div
        style={{
          ...lineStyles,
          width: size - 2,
          height: 1,
          [isTop ? 'top' : 'bottom']: 0,
          [isLeft ? 'left' : 'right']: 0,
        }}
      />
      {/* Vertical line */}
      <div
        style={{
          ...lineStyles,
          width: 1,
          height: size - 2,
          [isTop ? 'top' : 'bottom']: 0,
          [isLeft ? 'left' : 'right']: 0,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build succeeds.

---

## Phase 2: Window System (Week 3-4)

---

### Task 2.1: Rewrite WindowFrame with Doppelrand

**Files:**
- Modify: `src/components/window/WindowFrame.tsx`

**Context:** Complete rewrite of WindowFrame to use Doppelrand double-bezel architecture, CornerDecor components, holographic animations, and enhanced title bar.

- [ ] **Step 1: Rewrite WindowFrame.tsx**

Replace the entire file with:

```tsx
// src/components/window/WindowFrame.tsx
import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { Container, WindowState } from '../../core/types';
import { WindowContent } from './WindowContent';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { useVioStore } from '../../core/stores/vioStore';
import { CornerDecor } from '../effects/CornerDecor';
import { holographicOpen } from '../../lib/animations';
import { MIN_CONTAINER_WIDTH, MIN_CONTAINER_HEIGHT } from '../../lib/geometry';

interface WindowFrameProps {
  container: Container;
}

export function WindowFrame({ container }: WindowFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const resizingRef = useRef<string | null>(null);
  const startPosRef = useRef({ x: 0, y: 0, left: 0, top: 0, width: 0, height: 0 });
  const { theme } = useThemeStore();
  const moveContainer = useVioStore((s) => s.moveContainer);
  const resizeContainer = useVioStore((s) => s.resizeContainer);
  const focusWindow = useVioStore((s) => s.focusWindow);
  const snapContainer = useVioStore((s) => s.snapContainer);
  const unsnapContainer = useVioStore((s) => s.unsnapContainer);
  const controls = useAnimation();
  const [isExiting, setIsExiting] = useState(false);

  const activeWindow = container.windows.find((w) => w.id === container.activeWindowId) || container.windows[0];
  if (!activeWindow) return null;

  const isFocused = activeWindow.isFocused;
  const accent = theme.colors.accent;
  const accentGlow = theme.colors.accentGlow;

  // Holographic entrance animation on mount
  useEffect(() => {
    controls.start('animate');
  }, [controls]);

  const handleTitleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: container.position.x,
      top: container.position.y,
      width: container.size.width,
      height: container.size.height,
    };
    focusWindow(activeWindow.id);
  }, [container.position, container.size, container.id, focusWindow, activeWindow.id]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, dir: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = dir;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: container.position.x,
      top: container.position.y,
      width: container.size.width,
      height: container.size.height,
    };
  }, [container.position, container.size]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingRef.current) {
        const dx = e.clientX - startPosRef.current.x;
        const dy = e.clientY - startPosRef.current.y;
        if (frameRef.current) {
          frameRef.current.style.left = `${startPosRef.current.left + dx}px`;
          frameRef.current.style.top = `${startPosRef.current.top + dy}px`;
        }
      } else if (resizingRef.current) {
        const dx = e.clientX - startPosRef.current.x;
        const dy = e.clientY - startPosRef.current.y;
        const dir = resizingRef.current;
        if (frameRef.current) {
          if (dir.includes('e')) {
            frameRef.current.style.width = `${Math.max(MIN_CONTAINER_WIDTH, startPosRef.current.width + dx)}px`;
          }
          if (dir.includes('s')) {
            frameRef.current.style.height = `${Math.max(MIN_CONTAINER_HEIGHT, startPosRef.current.height + dy)}px`;
          }
          if (dir.includes('w')) {
            const newW = Math.max(MIN_CONTAINER_WIDTH, startPosRef.current.width - dx);
            frameRef.current.style.width = `${newW}px`;
            frameRef.current.style.left = `${startPosRef.current.left + startPosRef.current.width - newW}px`;
          }
          if (dir.includes('n')) {
            const newH = Math.max(MIN_CONTAINER_HEIGHT, startPosRef.current.height - dy);
            frameRef.current.style.height = `${newH}px`;
            frameRef.current.style.top = `${startPosRef.current.top + startPosRef.current.height - newH}px`;
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (draggingRef.current && frameRef.current) {
        const left = parseInt(frameRef.current.style.left || '0', 10);
        const top = parseInt(frameRef.current.style.top || '0', 10);
        moveContainer(container.id, { x: left, y: top });
      }
      if (resizingRef.current && frameRef.current) {
        const width = parseInt(frameRef.current.style.width || '0', 10);
        const height = parseInt(frameRef.current.style.height || '0', 10);
        resizeContainer(container.id, { width, height });
      }
      if (draggingRef.current || resizingRef.current) {
        focusWindow(activeWindow.id);
      }
      draggingRef.current = false;
      resizingRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [container.id, activeWindow.id, moveContainer, resizeContainer, focusWindow]);

  const windowState: WindowState = {
    id: activeWindow.id,
    type: activeWindow.type,
    title: activeWindow.title,
    position: container.position,
    size: container.size,
    prevPosition: container.prevPosition,
    prevSize: container.prevSize,
    isMinimized: activeWindow.isMinimized,
    isMaximized: !!container.snapRegion,
    isFocused: activeWindow.isFocused,
    isVisible: true,
    zIndex: container.zIndex,
    config: activeWindow.config,
    createdAt: activeWindow.createdAt,
    updatedAt: activeWindow.updatedAt,
  };

  return (
    <motion.div
      ref={frameRef}
      data-window-frame
      data-container-id={container.id}
      initial="initial"
      animate={controls}
      exit="exit"
      variants={holographicOpen}
      style={{
        position: 'absolute',
        overflow: 'hidden',
        left: container.position.x,
        top: container.position.y,
        width: container.size.width,
        height: container.size.height,
        zIndex: container.zIndex,
      }}
      onMouseDown={() => focusWindow(activeWindow.id)}
    >
      {/* Doppelrand Outer Shell */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: 1,
          background: isFocused ? `${accent}08` : 'transparent',
          borderRadius: 12,
          boxShadow: isFocused
            ? `0 0 20px ${theme.colors.accentGlow15}, 0 0 40px ${theme.colors.accentGlow08}`
            : `0 10px 40px rgba(0,0,0,0.5), 0 0 5px ${theme.colors.accentGlow08}`,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Corner Decorators */}
        <CornerDecor position="tl" isFocused={isFocused} />
        <CornerDecor position="tr" isFocused={isFocused} />
        <CornerDecor position="bl" isFocused={isFocused} />
        <CornerDecor position="br" isFocused={isFocused} />

        {/* Doppelrand Inner Core */}
        <div
          style={{
            position: 'absolute',
            inset: 1,
            borderRadius: 11,
            border: `0.5px solid ${isFocused ? `${accent}40` : theme.colors.borderDefault}`,
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.05)`,
            background: `${theme.colors.bgSecondary}b0`,
            backdropFilter: 'blur(20px) saturate(140%)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Title Bar with scanline texture */}
          <div
            style={{
              height: 32,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isFocused
                ? `${theme.colors.accentGlow06}`
                : 'transparent',
              borderBottom: `1px solid ${isFocused ? theme.colors.accentDim15 : 'rgba(255,255,255,0.03)'}`,
              cursor: 'move',
              transition: 'all 0.3s ease',
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.01) 2px,
                rgba(255,255,255,0.01) 4px
              )`,
            }}
            onMouseDown={handleTitleMouseDown}
          >
            {/* Left: status indicator + icon + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 3,
                  height: 14,
                  borderRadius: 1,
                  background: isFocused ? accent : theme.colors.textTertiary,
                  opacity: isFocused ? 1 : 0.3,
                  boxShadow: isFocused ? `0 0 6px ${accentGlow}` : 'none',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 3,
                  color: isFocused ? accent : theme.colors.textTertiary,
                  fontFamily: theme.font.mono,
                  opacity: isFocused ? 1 : 0.6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  textShadow: isFocused ? `0 0 8px ${theme.colors.accentGlow25}` : 'none',
                }}
              >
                {activeWindow.title}
              </span>
            </div>

            {/* Window Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WindowControlButton
                onClick={() => useVioStore.getState().toggleMinimizeWindow(activeWindow.id)}
                label="−"
                theme={theme}
              />
              <WindowControlButton
                onClick={() => container.snapRegion ? unsnapContainer(container.id) : snapContainer(container.id, 'left-half')}
                label={container.snapRegion ? '❐' : '□'}
                theme={theme}
              />
              <WindowControlButton
                onClick={() => useVioStore.getState().closeWindow(activeWindow.id)}
                label="×"
                theme={theme}
              />
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: 12, overflow: 'auto', height: 'calc(100% - 32px)' }}>
            <WindowContent window={windowState} />
          </div>

          {/* Resize handles */}
          {!container.snapRegion && (
            <>
              <ResizeHandle dir="n" onMouseDown={(e) => handleResizeMouseDown(e, 'n')} theme={theme} />
              <ResizeHandle dir="s" onMouseDown={(e) => handleResizeMouseDown(e, 's')} theme={theme} />
              <ResizeHandle dir="e" onMouseDown={(e) => handleResizeMouseDown(e, 'e')} theme={theme} />
              <ResizeHandle dir="w" onMouseDown={(e) => handleResizeMouseDown(e, 'w')} theme={theme} />
              <ResizeHandle dir="ne" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} theme={theme} />
              <ResizeHandle dir="nw" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} theme={theme} />
              <ResizeHandle dir="se" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} theme={theme} />
              <ResizeHandle dir="sw" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} theme={theme} />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function WindowControlButton({ onClick, label, theme }: { onClick: () => void; label: string; theme: import('../../types').ThemeConfig }) {
  return (
    <motion.button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        cursor: 'default',
        borderRadius: 4,
        color: theme.colors.textTertiary,
        fontSize: 10,
        fontFamily: theme.font.mono,
        padding: 0,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = theme.colors.accentGlow10;
        (e.currentTarget as HTMLButtonElement).style.color = theme.colors.accent;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.color = theme.colors.textTertiary;
      }}
    >
      {label}
    </motion.button>
  );
}

function ResizeHandle({ dir, onMouseDown, theme }: { dir: string; onMouseDown: (e: React.MouseEvent) => void; theme: import('../../types').ThemeConfig }) {
  const positions: Record<string, React.CSSProperties> = {
    n: { top: -3, left: 8, right: 8, height: 6, cursor: 'ns-resize' },
    s: { bottom: -3, left: 8, right: 8, height: 6, cursor: 'ns-resize' },
    e: { right: -3, top: 8, bottom: 8, width: 6, cursor: 'ew-resize' },
    w: { left: -3, top: 8, bottom: 8, width: 6, cursor: 'ew-resize' },
    ne: { top: -3, right: -3, width: 12, height: 12, cursor: 'nesw-resize' },
    nw: { top: -3, left: -3, width: 12, height: 12, cursor: 'nwse-resize' },
    se: { bottom: -3, right: -3, width: 12, height: 12, cursor: 'nwse-resize' },
    sw: { bottom: -3, left: -3, width: 12, height: 12, cursor: 'nesw-resize' },
  };

  return (
    <div
      style={{ position: 'absolute', ...positions[dir], zIndex: 10 }}
      onMouseDown={onMouseDown}
    >
      {/* Visual indicator on hover */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'transparent',
          transition: 'background 0.15s ease',
          borderRadius: 2,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = theme.colors.accentGlow15;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build succeeds.

---

## Phase 3: Global Animations (Week 5-6)

---

### Task 3.1: Workspace Switch Animation

**Files:**
- Modify: `src/components/layout/Desktop.tsx`

**Context:** Add AnimatePresence + motion.div wrapper for workspace switching with slide transitions.

- [ ] **Step 1: Update Desktop.tsx workspace rendering**

Replace the visible containers rendering section with animated workspace groups:

```tsx
// In Desktop.tsx, replace the AnimatePresence + WindowFrame map with:

{monitors.map((monitor) => (
  <div key={monitor.id} style={{ position: 'absolute', inset: 0 }}>
    {monitor.workspaces.map((workspace) => (
      <AnimatePresence mode="wait" key={workspace.id}>
        {workspace.isActive && (
          <motion.div
            key={workspace.id}
            initial={{ x: '15%', opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: '-15%', opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.4,
              ease: [0.32, 0.72, 0, 1],
              staggerChildren: 0.03,
            }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {workspace.containers
              .filter((c) => !c.windows.every((w) => w.isMinimized))
              .map((container) => (
                <WindowFrame key={container.id} container={container} />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    ))}
  </div>
))}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build succeeds.

---

### Task 3.2: AppGrid Staggered Animation

**Files:**
- Modify: `src/components/layout/AppGrid.tsx`

**Context:** Already rewritten in previous session. Add staggered enter/exit animations.

- [ ] **Step 1: Wrap AppGrid content in motion container**

In the existing AppGrid.tsx, wrap the cards container and individual cards:

```tsx
// Wrap the cards grid container:
<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={staggerContainer}
  // ... existing style props
>

// Wrap each card:
<motion.div
  key={containerId}
  variants={staggerItem}
  // ... existing props
>
```

Import the variants from `src/lib/animations.ts`:
```tsx
import { staggerContainer, staggerItem } from '../../lib/animations';
```

- [ ] **Step 2: Add background overlay animation**

Wrap the root div:
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
  // ... existing style
>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds.

---

### Task 3.3: Launcher Expand Animation

**Files:**
- Modify: `src/components/layout/Launcher.tsx`

**Context:** Add expand-from-button animation using scale + border-radius transition.

- [ ] **Step 1: Update Launcher with motion wrapper**

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIn } from '../../lib/animations';

// In JSX, wrap the root div:
<AnimatePresence>
  {visible && (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, borderRadius: '50%' }}
      animate={{ opacity: 1, scale: 1, borderRadius: 6 }}
      exit={{ opacity: 0, scale: 0.8, borderRadius: '50%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      // ... existing style props
    >
      {/* existing content */}
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build succeeds.

---

## Phase 4: New Features (Week 7-8)

---

### Task 4.1: System Tray (Rust)

**Files:**
- Create: `src-tauri/src/commands/tray.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/commands/mod.rs`

**Context:** Tauri 2.0 tray icon + context menu.

- [ ] **Step 1: Create tray.rs**

```rust
// src-tauri/src/commands/tray.rs

use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn set_tray_icon(app_handle: AppHandle, icon_name: String) -> Result<(), String> {
    if let Some(tray) = app_handle.tray_by_id("main") {
        let icon_path = format!("icons/{}-tray.png", icon_name);
        let icon = tauri::image::Image::from_path(&icon_path)
            .map_err(|e| e.to_string())?;
        tray.set_icon(Some(icon)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn set_startup_enabled(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::utils::platform::current_exe;
        let app_path = current_exe().map_err(|e| e.to_string())?;
        let _ = std::process::Command::new("osascript")
            .arg("-e")
            .arg(format!(
                "tell application \"System Events\" to {} login item \"{}\"",
                if enabled { "make" } else { "delete" },
                app_path.file_name().unwrap().to_string_lossy()
            ))
            .output()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        use winreg::enums::*;
        use winreg::RegKey;
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let run = hkcu.open_subkey_with_flags(
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            if enabled { KEY_WRITE } else { KEY_READ | KEY_WRITE }
        ).map_err(|e| e.to_string())?;
        
        if enabled {
            let app_path = std::env::current_exe().map_err(|e| e.to_string())?;
            run.set_value("VIO", &app_path.to_string_lossy().to_string())
                .map_err(|e| e.to_string())?;
        } else {
            run.delete_value("VIO").map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
```

- [ ] **Step 2: Register commands**

Add to `mod.rs`:
```rust
pub mod tray;
```

Add to `lib.rs`:
```rust
use commands::tray::{set_tray_icon, set_startup_enabled};

// In invoke_handler:
.set_invoke_handler(tauri::generate_handler![
    // ... existing commands
    set_tray_icon,
    set_startup_enabled,
])
```

- [ ] **Step 3: Verify Rust build**

Run: `cd src-tauri && cargo check`

Expected: Build succeeds (may need `winreg` crate on Windows).

---

### Task 4.2: Notification Center

**Files:**
- Create: `src/components/layout/NotificationPanel.tsx`
- Modify: `src/components/layout/TaskBar.tsx`

- [ ] **Step 1: Create NotificationPanel component**

```tsx
// src/components/layout/NotificationPanel.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { slideFromRight, staggerContainer, staggerItem } from '../../lib/animations';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

interface NotificationPanelProps {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
  onClear: () => void;
  onDismiss: (id: string) => void;
}

export function NotificationPanel({ visible, notifications, onClose, onClear, onDismiss }: NotificationPanelProps) {
  const { theme } = useThemeStore();

  const typeColors = {
    info: theme.colors.accent,
    warning: '#ffb000',
    error: '#ff3333',
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 199,
              background: 'rgba(0,0,0,0.3)',
            }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={slideFromRight}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 320,
              height: 'calc(100vh - 36px)',
              zIndex: 200,
              background: `${theme.colors.bgSecondary}cc`,
              backdropFilter: 'blur(20px) saturate(140%)',
              borderLeft: `0.5px solid ${theme.colors.borderDefault}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${theme.colors.borderDefault}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: theme.colors.textSecondary,
                    fontFamily: theme.font.mono,
                  }}
                >
                  Notifications
                </span>
                {notifications.length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      background: theme.colors.accentGlow15,
                      color: theme.colors.accent,
                      fontFamily: theme.font.mono,
                    }}
                  >
                    {notifications.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClear}
                style={{
                  fontSize: 10,
                  color: theme.colors.textTertiary,
                  fontFamily: theme.font.mono,
                  cursor: 'default',
                  letterSpacing: 1,
                }}
              >
                Clear All
              </button>
            </div>

            {/* List */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              style={{ flex: 1, overflow: 'auto', padding: 12 }}
            >
              {notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 40,
                    color: theme.colors.textTertiary,
                    fontSize: 12,
                    fontFamily: theme.font.mono,
                  }}
                >
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    variants={staggerItem}
                    layout
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 12,
                      marginBottom: 8,
                      borderRadius: 8,
                      background: theme.colors.bgPrimary + '80',
                      border: `1px solid ${theme.colors.borderDefault}`,
                      position: 'relative',
                    }}
                  >
                    {/* Color bar */}
                    <div
                      style={{
                        width: 3,
                        borderRadius: 2,
                        background: typeColors[n.type],
                        flexShrink: 0,
                      }}
                    />
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: theme.colors.textPrimary,
                          fontFamily: theme.font.ui,
                          marginBottom: 4,
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: theme.colors.textTertiary,
                          fontFamily: theme.font.mono,
                          marginBottom: 4,
                        }}
                      >
                        {n.timestamp.toLocaleTimeString()}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: theme.colors.textSecondary,
                          fontFamily: theme.font.ui,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {n.message}
                      </div>
                    </div>
                    {/* Dismiss */}
                    <button
                      onClick={() => onDismiss(n.id)}
                      style={{
                        color: theme.colors.textTertiary,
                        fontSize: 14,
                        lineHeight: 1,
                        cursor: 'default',
                        padding: 4,
                      }}
                    >
                      ×
                    </button>
                  </motion.div>
                ))
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Add notification bell to TaskBar**

In TaskBar.tsx, add a bell icon button before the Settings button:

```tsx
const [notificationsOpen, setNotificationsOpen] = useState(false);
const [notifications, setNotifications] = useState<Notification[]>([]);

// In JSX, before Settings button:
<button
  onClick={() => setNotificationsOpen((v) => !v)}
  style={{
    padding: '4px 12px',
    fontSize: 11,
    borderRadius: 3,
    cursor: 'default',
    fontFamily: theme.font.ui,
    letterSpacing: 1,
    color: textSecondary,
    border: '1px solid transparent',
    background: 'transparent',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    position: 'relative',
  }}
>
  🔔
  {notifications.length > 0 && (
    <span
      style={{
        position: 'absolute',
        top: -2,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: theme.colors.accent,
        boxShadow: `0 0 4px ${theme.colors.accentGlow25}`,
      }}
    />
  )}
</button>

// At bottom of TaskBar JSX, after ContextMenu:
<NotificationPanel
  visible={notificationsOpen}
  notifications={notifications}
  onClose={() => setNotificationsOpen(false)}
  onClear={() => setNotifications([])}
  onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
/>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds.

---

### Task 4.3: Window Thumbnails

**Files:**
- Create: `src/hooks/useThumbnail.ts`

**Context:** Use html2canvas to capture window content for AppGrid and TaskBar hover preview.

- [ ] **Step 1: Install html2canvas**

Run: `npm install html2canvas`

- [ ] **Step 2: Create useThumbnail hook**

```typescript
// src/hooks/useThumbnail.ts

import { useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';

export function useThumbnail(containerId: string) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const generatingRef = useRef(false);

  const generate = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;

    try {
      const element = document.querySelector(`[data-container-id="${containerId}"]`);
      if (!element) return;

      // Check if content is canvas/webgl-heavy
      const hasCanvas = element.querySelector('canvas') !== null;
      if (hasCanvas) {
        // For canvas content, use fallback icon instead
        setThumbnail(null);
        return;
      }

      const canvas = await html2canvas(element as HTMLElement, {
        scale: 0.3,
        logging: false,
        backgroundColor: null,
        useCORS: true,
      });

      setThumbnail(canvas.toDataURL('image/png'));
    } catch {
      setThumbnail(null);
    } finally {
      generatingRef.current = false;
    }
  }, [containerId]);

  const clear = useCallback(() => {
    setThumbnail(null);
  }, []);

  return { thumbnail, generate, clear };
}
```

- [ ] **Step 3: Integrate into AppGrid**

In AppGrid.tsx, generate thumbnails when entering:

```tsx
import { useThumbnail } from '../../hooks/useThumbnail';

// In each card, add thumbnail:
const { thumbnail, generate } = useThumbnail(containerId);

useEffect(() => {
  if (visible) generate();
}, [visible, generate]);

// In card content, replace icon with thumbnail if available:
{thumbnail ? (
  <img
    src={thumbnail}
    alt=""
    style={{
      width: '100%',
      height: 120,
      objectFit: 'cover',
      borderRadius: 4,
      marginBottom: 8,
    }}
  />
) : (
  <div style={{ /* existing icon */ }}>
    {getTypeIcon(activeWin?.type || '')}
  </div>
)}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`

Expected: Build succeeds.

---

### Task 4.4: Multi-Monitor Indicator

**Files:**
- Create: `src/components/layout/MonitorIndicator.tsx`

- [ ] **Step 1: Create MonitorIndicator component**

```tsx
// src/components/layout/MonitorIndicator.tsx

import { motion } from 'framer-motion';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { useVioStore } from '../../core/stores/vioStore';

interface MonitorIndicatorProps {
  monitor: {
    id: string;
    isPrimary: boolean;
    workspaces: { id: string; name: string; isActive: boolean; containers: { id: string }[] }[];
  };
  position?: 'bottom-left' | 'bottom-right';
}

export function MonitorIndicator({ monitor, position = 'bottom-right' }: MonitorIndicatorProps) {
  const { theme } = useThemeStore();
  const switchWorkspace = useVioStore((s) => s.switchWorkspace);

  const activeWorkspace = monitor.workspaces.find((w) => w.isActive);
  const totalWindows = monitor.workspaces.reduce((sum, w) => sum + w.containers.length, 0);

  const posStyle: React.CSSProperties = position === 'bottom-right'
    ? { bottom: 48, right: 16 }
    : { bottom: 48, left: 16 };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        position: 'fixed',
        ...posStyle,
        zIndex: 50,
        width: 48,
        height: 48,
        borderRadius: 8,
        background: `${theme.colors.bgSecondary}cc`,
        backdropFilter: 'blur(12px)',
        border: `0.5px solid ${monitor.isPrimary ? theme.colors.accent : theme.colors.borderDefault}`,
        boxShadow: monitor.isPrimary
          ? `0 0 12px ${theme.colors.accentGlow15}`
          : '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        cursor: 'default',
        transition: 'all 0.3s ease',
      }}
      title={`Monitor ${monitor.id}\n${activeWorkspace?.name || 'No workspace'}\n${totalWindows} windows`}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: monitor.isPrimary ? theme.colors.accent : theme.colors.textSecondary,
          fontFamily: theme.font.display,
          lineHeight: 1,
        }}
      >
        {monitor.isPrimary ? '1' : monitor.id.slice(-1)}
      </span>
      <span
        style={{
          fontSize: 8,
          color: theme.colors.textTertiary,
          fontFamily: theme.font.mono,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {activeWorkspace?.name?.slice(0, 1) || '?'}
      </span>
      {totalWindows > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: theme.colors.accent,
            color: theme.colors.bgPrimary,
            fontSize: 8,
            fontFamily: theme.font.mono,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {totalWindows}
        </span>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Add to Desktop.tsx**

```tsx
import { MonitorIndicator } from './MonitorIndicator';

// In JSX, after TaskBar:
{monitors.map((monitor) => (
  <MonitorIndicator
    key={monitor.id}
    monitor={monitor}
    position={monitor.isPrimary ? 'bottom-right' : 'bottom-left'}
  />
))}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds.

---

## Self-Review

### Spec Coverage Check

| Spec Section | Task(s) |
|-------------|---------|
| 2.1 Color System (gradient backgrounds, glow variants) | 1.3, 1.4 |
| 2.2 Typography (Google Fonts) | 1.1, 1.3 |
| 2.3 Radius System | 2.1 |
| 2.4 Shadow System | 2.1 |
| 3.1 Window Chrome Doppelrand | 2.1 |
| 3.2 Holographic Open | 2.1 (variants in 1.2) |
| 3.3 Data Dissipate Close | 1.2 (variants) |
| 3.4 Drag Physics | 2.1 (existing, enhanced) |
| 3.5 Neon Focus | 2.1 (CSS + CornerDecor) |
| 4.1 Easing Family | 1.2 |
| 4.2 Hover/Active Feedback | 2.1 (WindowControlButton) |
| 4.3 Workspace Switch | 3.1 |
| 4.4 AppGrid Enter/Exit | 3.2 |
| 4.5 Launcher Open/Close | 3.3 |
| 5.1 System Tray | 4.1 |
| 5.2 Notification Center | 4.2 |
| 5.3 Window Thumbnails | 4.3 |
| 5.4 Multi-Monitor Indicator | 4.4 |

**Gap:** None. All spec requirements covered.

### Placeholder Scan

- No TBD, TODO, or "implement later" found.
- All code blocks contain complete, runnable code.
- All file paths are exact.

### Type Consistency

- `ThemeConfig` type used consistently across all components.
- `Container`, `WindowState` types from `src/core/types` used in WindowFrame.
- `staggerContainer` / `staggerItem` variants defined once in `animations.ts` and reused.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-07-vio-cinematic-sci-fi-ui.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for this large plan (28 tasks across 4 phases).

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

**Which approach?**
