# VIO Cinematic Sci-Fi UI/UX Design Specification

> **Date**: 2026-05-06
> **Direction**: 方案 A · 电影级科幻（Cinematic Sci-Fi）
> **Scope**: 现有体验打磨 + 新功能（AI 接入除外）
> **Standard**: No compromises — $150k agency-level execution
> **Reference**: high-end-visual-design skill

---

## 1. Overview

### 1.1 Goal

Transform VIO from a "sci-fi themed terminal manager" into a **cinematic sci-fi desktop environment** that feels like operating a $1M+ mission control console. Every pixel, every animation, every micro-interaction must evoke the visual language of *Blade Runner 2049*, *Cyberpunk 2077*, and *The Matrix* — but refined to daily-driver usability.

### 1.2 Design Pillars

| Pillar | Meaning |
|--------|---------|
| **Haptic Depth** | Every element feels like physical machined hardware — not flat digital widgets |
| **Cinematic Motion** | Animations tell a story: windows don't just appear, they *materialize* |
| **Neon Luminescence** | Light is not decoration — it's the primary communication layer |
| **Spatial Rhythm** | Whitespace is as important as content; the design breathes |
| **Flawless Fluidity** | 60fps everywhere. Zero jank. Zero compromise. |

### 1.3 Success Criteria

- [ ] All window operations (open/close/minimize/maximize/drag/snap) feel like physical objects with mass
- [ ] Every interactive element has distinct hover/active/focus states with luminous feedback
- [ ] Workspace switching is a cinematic transition, not a jump cut
- [ ] AppGrid feels like a holographic projection interface
- [ ] System tray, notifications, and thumbnails integrate seamlessly into the sci-fi aesthetic
- [ ] All animations use custom cubic-bezier curves — zero default `ease-in-out`
- [ ] GPU-safe: only `transform` and `opacity` animated, no layout thrashing

---

## 2. Visual System (Section 1)

### 2.1 Color System

**保持现有三主题**（Cyberpunk / Matrix / Amber），但提升质感。

#### Background Layer

| Theme | Current | Optimized |
|-------|---------|-----------|
| **Cyberpunk** | `#0a0a0f` solid | Radial gradient from `#0a0a0f` to `#050508` + subtle noise texture overlay |
| **Matrix** | `#0a0f0a` solid | Radial gradient from `#0a0f0a` to `#050805` + CRT scanline texture |
| **Amber** | `#0f0a05` solid | Radial gradient from `#0f0a05` to `#0a0503` + film grain texture |

**Noise Texture** (CSS):
```css
background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
```

#### Glass Layer

Current: `backdrop-filter: blur(16px)`

Optimized: `backdrop-filter: blur(20px) saturate(140%)`
Plus inner highlight: `box-shadow: inset 0 1px 1px rgba(255,255,255,0.05)`

#### Border Layer — Doppelrand Double-Bezel

```
Outer Shell:  0.5px border, rgba(accent, 0.08)
              + subtle outer glow (rgba(accent, 0.04))
Groove:       1px inset shadow (rgba(0,0,0,0.3))
Inner Core:   0.5px border, rgba(accent, 0.25)
              + inner highlight (rgba(255,255,255,0.05))
```

#### Glow Layer — Dynamic Neon Tube

Use CSS `@property` for animated glow along borders:

```css
@property --glow-pos {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}

@keyframes neon-sweep {
  0% { --glow-pos: 0%; }
  100% { --glow-pos: 100%; }
}

.window-focused {
  border-image: linear-gradient(
    90deg,
    transparent var(--glow-pos),
    rgba(0, 240, 255, 0.6) calc(var(--glow-pos) + 20%),
    transparent calc(var(--glow-pos) + 40%)
  ) 1;
  animation: neon-sweep 2s ease-in-out infinite;
}
```

### 2.2 Typography System

| Role | Current | Optimized | Fallback |
|------|---------|-----------|----------|
| **Display** (titles, logos) | Orbitron | `Space Grotesk` | system-ui |
| **Mono** (terminals, data) | JetBrains Mono | `Geist Mono` | monospace |
| **UI** (buttons, labels) | Rajdhani | `Plus Jakarta Sans` | system-ui |

**Google Fonts CDN** (add to `index.html`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Typography Scale**:
- Logo: `24px, weight 700, letter-spacing 8px, uppercase`
- Window Title: `11px, weight 500, letter-spacing 3px, uppercase`
- Section Title: `14px, weight 600, letter-spacing 2px`
- Body: `12px, weight 400, letter-spacing 0.3px`
- Caption: `10px, weight 400, letter-spacing 1px`

### 2.3 Radius System

| Level | Value | Usage |
|-------|-------|-------|
| Window | `12px` | Main window chrome |
| Card | `8px` | Inner panels, notifications |
| Button/Input | `6px` | Interactive elements |
| Pill | `9999px` | Tags, badges, status indicators |

### 2.4 Shadow System

| Name | Value | Usage |
|------|-------|-------|
| `shadow-window` | `0 10px 40px rgba(0,0,0,0.5), 0 0 5px rgba(accent,0.08)` | Unfocused window |
| `shadow-window-focused` | `0 10px 40px rgba(0,0,0,0.5), 0 0 15px rgba(accent,0.2), 0 0 30px rgba(accent,0.1)` | Focused window |
| `shadow-elevated` | `0 20px 60px rgba(0,0,0,0.6), 0 0 20px rgba(accent,0.15)` | Modals, overlays |
| `shadow-inner-glow` | `inset 0 1px 1px rgba(255,255,255,0.05)` | Glass panels |

---

## 3. Window System (Section 2)

### 3.1 Window Chrome — Doppelrand Architecture

```tsx
// WindowFrame structure
<WindowFrame>
  <OuterShell>      {/* 0.5px border + outer glow */}
    <CornerDecor tl />  {/* L-shaped corner indicator */}
    <CornerDecor tr />
    <CornerDecor bl />
    <CornerDecor br />
    <InnerCore>      {/* 0.5px border + inner highlight */}
      <TitleBar>     {/* scanline texture background */}
        <TypeIcon />
        <Title />
        <WindowControls />
      </TitleBar>
      <Content />
    </InnerCore>
  </OuterShell>
</WindowFrame>
```

**Corner Decorators**:
- Size: 12×12px
- Style: L-shaped line, 1px thick
- Unfocused: `rgba(accent, 0.15)` static
- Focused: `rgba(accent, 0.6)` + subtle pulse animation
- Each corner pulses in sequence (TL → TR → BR → BL) on focus

**Title Bar**:
- Height: 32px (from 28px)
- Background: `repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255,255,255,0.01) 2px,
    rgba(255,255,255,0.01) 4px
  )` on top of base color
- Status indicator: 3×14px vertical bar, left of title
- Title: uppercase, letter-spacing 3px, `text-glow` class

### 3.2 Window Open Animation — Holographic Scan

**Sequence** (500ms total):
1. **T=0ms**: Window appears as 1px horizontal line at center, full width, accent color, intense glow
2. **T=0-300ms**: Line expands vertically with `clip-path: inset(50% 0%) → inset(0% 0%)`, revealing content
3. **T=200-400ms**: Corner decorators fade in sequentially (50ms stagger)
4. **T=300-500ms**: Full window does slight scale bounce `scale(0.98) → scale(1)` with spring physics

**Framer Motion**:
```tsx
const holographicVariants = {
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
      clipPath: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
      opacity: { duration: 0.2 },
      scale: { type: 'spring', stiffness: 400, damping: 25, delay: 0.3 },
    },
  },
  exit: {
    clipPath: 'inset(49.5% 0% 49.5% 0%)',
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  },
};
```

### 3.3 Window Close Animation — Data Dissipation

**Sequence** (400ms total):
1. **T=0ms**: Brief RGB split glitch effect (`text-shadow: -2px 0 red, 2px 0 cyan`)
2. **T=50-250ms**: Content scrambles (random character replacement, optional)
3. **T=200-400ms**: Vertical compress to 1px line, then fade out with horizontal scan

### 3.4 Drag Experience — Magnetic Physics

- **During drag**: Window follows mouse with `dragElastic: 0.05` (slight lag for mass feel)
- **Tilt**: `rotateZ(0.5deg)` proportional to drag velocity
- **Glow boost**: Border glow intensity increases 2× during drag
- **Snap preview**: Ghost outline shows target position before release
- **Release**: Spring animation to final position (`stiffness: 300, damping: 30`)

### 3.5 Focus State — Neon Tube Power-On

- **Border**: `@property` animated glow sweeps around perimeter (2s loop)
- **Corners**: Sequential pulse — TL → TR → BR → BL, each 200ms
- **Title bar**: Scanline animation speed increases 2×
- **Shadow**: Expands from `shadow-window` to `shadow-window-focused`
- **Defocus**: All effects reverse in 300ms

---

## 4. Motion System (Section 3)

### 4.1 Easing Family

```typescript
// src/lib/framer.ts
export const easings = {
  // Spring physics
  springSnappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
  springGentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  springBounce: { type: 'spring' as const, stiffness: 300, damping: 20 },
  
  // Cubic bezier
  cubicEnter: [0.32, 0.72, 0, 1] as const,
  cubicExit: [0.4, 0, 1, 1] as const,
  cubicBounce: [0.34, 1.56, 0.64, 1] as const,
  cubicSmooth: [0.22, 1, 0.36, 1] as const,
} as const;

export const durations = {
  micro: 0.15,      // hover, focus
  state: 0.3,       // minimize, maximize
  structural: 0.5,  // open, close, workspace switch
  ambient: 2.0,     // glow, pulse loops
} as const;
```

### 4.2 Hover / Active / Focus Feedback

**Button Pattern**:
```tsx
<motion.button
  whileHover={{ 
    y: -1, 
    boxShadow: '0 4px 20px rgba(accent, 0.2)',
  }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15, ease: easings.cubicEnter }}
>
```

**TaskBar Window Button**:
- Hover: Bottom border expands from center (`scaleX: 0 → 1`)
- Active: 2px accent indicator line + glow
- Transition: `all 200ms cubic-bezier(0.32, 0.72, 0, 1)`

**Resize Handle**:
- Hover: Scale to 1.5× + glow
- Drag: Scale to 2× + intense glow

### 4.3 Workspace Switch Animation

**Old workspace exit** (300ms):
- `translateX(0) → translateX(-15%)`
- `opacity(1) → opacity(0)`
- `scale(1) → scale(0.95)`
- Easing: `cubicExit`

**New workspace enter** (400ms):
- `translateX(15%) → translateX(0)`
- `opacity(0) → opacity(1)`
- `scale(0.95) → scale(1)`
- Easing: `cubicEnter`
- Containers stagger: 30ms delay between each

**Background**: Subtle accent hue pulse during transition

### 4.4 AppGrid Enter / Exit

**Enter** (600ms total):
1. **T=0ms**: Background overlay fades in (`opacity: 0 → 1`, `backdrop-filter: blur(0) → blur(8px)`)
2. **T=100-600ms**: Cards stagger in from bottom (`translateY(30px) → 0`, `opacity: 0 → 1`, `scale: 0.9 → 1`)
3. Stagger: 40ms between cards
4. Easing: `cubicEnter`

**Exit** (400ms):
1. Selected card: Scale up + glow + fly toward target position
2. Other cards: Shrink + fade, reverse stagger
3. Background: Fade out

### 4.5 Launcher Open / Close

**Open** (500ms):
1. Origin: "⊕ New" button center
2. Circle expands (`scale: 0 → 1`, `border-radius: 50% → 12px`)
3. Content stagger from center

**Close** (300ms):
1. Reverse expansion back to button
2. Selected item leaves highlight trail

---

## 5. New Features (Section 4)

### 5.1 System Tray

**macOS**:
- Tauri `Menu` API for native menu bar
- Icon: Theme-aware SVG (cyan/green/amber)
- Menu items:
  - Show/Hide VIO
  - Switch Theme → Cyberpunk / Matrix / Amber
  - ────
  - Quit

**Windows/Linux**:
- Tauri `tray-icon` + custom context menu
- Icon: 16×16 + 32×32 PNG set
- Right-click menu (same items + "Start on Login")
- Status indicator dot: normal (dim), warning (yellow pulse), error (red pulse)

**Implementation**:
```rust
// src-tauri/src/commands/platform.rs
#[tauri::command]
pub fn set_tray_icon(app_handle: AppHandle, icon_path: String) { ... }

#[tauri::command]
pub fn set_startup_enabled(enabled: bool) -> Result<(), String> { ... }
```

### 5.2 Notification Center

**Trigger**: TaskBar 右侧新增铃铛图标，点击从右边缘滑出。

**Panel Design**:
- Width: 320px
- Height: `100vh - 36px` (full height minus TaskBar)
- Position: Fixed right, `z-index: 200`
- Background: Glass (`blur(20px) saturate(140%)`) + Doppelrand border
- Header: "NOTIFICATIONS" + count badge + "Clear All"

**Notification Item**:
```
┌─────────────────────────────┐
│ ┃ ◉  CPU Alert              │
│ ┃      2 minutes ago         │
│ ┃      CPU usage exceeded... │
│                    [×]        │
└─────────────────────────────┘
```
- Left: 3px color bar (theme accent = info, yellow = warning, red = error)
- Icon: Type indicator
- Title + timestamp + 1-line summary
- Close button (×)

**Animation**:
- Panel enter: `translateX(100%) → 0`, 300ms, `cubicEnter`
- New notification: Slide from top + spring bounce, 400ms
- Clear all: Notifications slide right + fade, staggered 50ms

**Types**:
- **System**: CPU/memory/disk alerts (from Rust backend polling)
- **App**: File transfer complete, scan complete
- **Agent**: (Reserved) Task complete, anomaly detected

### 5.3 Window Thumbnails

**AppGrid Mode**:
- Each card displays live thumbnail of window content
- Generation: `html2canvas` on entering AppGrid (one-shot, cached)
- Fallback: Type icon + title for Canvas/WebGL content
- Thumbnail: 240×180, rounded 6px, inside card

**TaskBar Hover Preview**:
- Hover on window button → popup thumbnail above TaskBar
- Size: 200×150
- Delay: 300ms (prevent flicker on quick pass)
- Style: Doppelrand border + `shadow-elevated`
- Contains: Window title + mini screenshot

**Implementation**:
```typescript
// src/hooks/useThumbnail.ts
export function useThumbnail(containerId: string) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  
  const generate = useCallback(async () => {
    const element = document.querySelector(`[data-container-id="${containerId}"]`);
    if (!element) return;
    const canvas = await html2canvas(element as HTMLElement, {
      scale: 0.5,
      logging: false,
    });
    setThumbnail(canvas.toDataURL('image/png'));
  }, [containerId]);
  
  return { thumbnail, generate };
}
```

### 5.4 Multi-Monitor Indicator

**Position**: Configurable — default bottom-right of each screen (above TaskBar)

**Display**:
```
┌─────┐
│  1  │  ← Screen number
│ α 3 │  ← Workspace name + window count
└─────┘
```
- Size: 48×48px
- Shape: Rounded square (8px)
- Background: `bgSecondary` + Doppelrand border
- Active screen: Border glows, accent color
- Inactive: Dimmed, border only

**Interactions**:
- Click: Switch to that screen's active workspace
- Drag window onto indicator: Move window to that screen
- Hover: Tooltip shows screen resolution + workspace list

**Animation**:
- Appear: Scale from 0 + fade, spring physics
- Screen switch: Glow pulse

---

## 6. Performance Guardrails

### 6.1 GPU-Safe Animation

- ✅ **Only animate**: `transform`, `opacity`, `filter` (sparingly)
- ❌ **Never animate**: `width`, `height`, `top`, `left`, `margin`, `padding`
- **Drag**: Use Framer Motion `drag` (handles via `transform`)
- **Resize**: Use `transform: scale()` preview, commit on mouseUp

### 6.2 Blur Constraints

- ✅ **Allowed on**: Fixed overlays (AppGrid, Launcher, Notification Center, StartupScreen)
- ❌ **Never on**: Scrolling containers, large content areas, window content
- **Backdrop blur**: Max `blur(20px)`, only on elements < 50% screen area

### 6.3 will-change Discipline

```css
/* Only apply to actively animating elements */
.window-animating {
  will-change: transform, opacity;
}

/* Remove after animation completes */
.window-static {
  will-change: auto;
}
```

### 6.4 Framer Motion Optimization

- Use `layoutId` for shared element transitions (workspace switch)
- Use `AnimatePresence mode="wait"` for sequential enter/exit
- Lazy load `motion` components:
  ```tsx
  const MotionDiv = motion.div; // At module level, not inside render
  ```

---

## 7. File Structure Changes

### New Files

```
src/
  lib/
    easings.ts              # Easing constants + duration constants
    animations.ts           # Reusable Framer Motion variants
  components/
    effects/
      NoiseOverlay.tsx      # Fixed noise texture overlay
      GlowBorder.tsx        # @property animated glow border component
      CornerDecor.tsx       # L-shaped corner indicator
    ui/
      DoppelrandCard.tsx    # Reusable double-bezel card wrapper
      NeonButton.tsx        # Button with hover/active physics
      StatusBadge.tsx       # Pill badge with pulse animation
    layout/
      NotificationPanel.tsx # Right-slide notification center
      TrayMenu.tsx          # Context menu for system tray
      MonitorIndicator.tsx  # Per-screen monitor indicator
  hooks/
    useThumbnail.ts         # html2canvas thumbnail generation
```

### Modified Files

```
src/
  index.css                 # Add noise texture, new keyframes, @property
  core/theme-engine/themes/
    cyberpunk.ts            # Add glow variants
    matrix.ts               # Add glow variants
    amber.ts                # Add glow variants
  components/
    window/
      WindowFrame.tsx       # Doppelrand + corner decor + new animations
    layout/
      Desktop.tsx           # Workspace switch animation + monitor indicators
      AppGrid.tsx           # Staggered enter/exit + thumbnails
      Launcher.tsx          # Expand-from-button animation
      TaskBar.tsx           # Notification bell + thumbnail preview
src-tauri/
  src/commands/platform.rs  # Tray icon, startup, monitor info
```

---

## 8. Phase Breakdown

### Phase 1: Foundation (Week 1-2)

- Typography system (Google Fonts integration)
- Color/glow system upgrade
- Doppelrand component + CornerDecor
- Noise overlay effect
- `easings.ts` + `animations.ts` utilities

### Phase 2: Window System (Week 3-4)

- WindowFrame Doppelrand redesign
- Holographic open/close animations
- Drag physics + snap preview
- Neon tube focus animation
- Title bar scanline texture

### Phase 3: Global Animations (Week 5-6)

- Workspace switch transition
- AppGrid enter/exit
- Launcher expand animation
- Button hover/active physics
- TaskBar interactions

### Phase 4: New Features (Week 7-8)

- System tray (Rust + frontend)
- Notification center
- Window thumbnails (html2canvas)
- Multi-monitor indicators
- Startup on login

---

*End of design specification*
