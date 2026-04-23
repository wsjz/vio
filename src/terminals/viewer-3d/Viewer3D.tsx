import { useEffect, useRef, useState } from 'react';
import { useThemeStore } from '../../core/theme-engine/themeStore';

interface Vec3 { x: number; y: number; z: number; }

function rotateX(p: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
}

function rotateY(p: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
}

function rotateZ(p: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos, z: p.z };
}

function project(p: Vec3, cx: number, cy: number, scale: number): { x: number; y: number } {
  const fov = 400;
  const dist = fov / (fov + p.z);
  return { x: cx + p.x * dist * scale, y: cy + p.y * dist * scale };
}

const CUBE_VERTICES: Vec3[] = [
  { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
  { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
  { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 },
  { x: 1, y: 1, z: 1 }, { x: -1, y: 1, z: 1 },
];

const CUBE_EDGES: [number, number][] = [
  [0,1], [1,2], [2,3], [3,0],
  [4,5], [5,6], [6,7], [7,4],
  [0,4], [1,5], [2,6], [3,7],
];

const PYRAMID_VERTICES: Vec3[] = [
  { x: 0, y: -1.2, z: 0 },
  { x: -1, y: 0.8, z: -1 },
  { x: 1, y: 0.8, z: -1 },
  { x: 1, y: 0.8, z: 1 },
  { x: -1, y: 0.8, z: 1 },
];

const PYRAMID_EDGES: [number, number][] = [
  [0,1], [0,2], [0,3], [0,4],
  [1,2], [2,3], [3,4], [4,1],
];

const OCTAHEDRON_VERTICES: Vec3[] = [
  { x: 0, y: -1.2, z: 0 }, { x: 0, y: 1.2, z: 0 },
  { x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
  { x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 1 },
];

const OCTAHEDRON_EDGES: [number, number][] = [
  [0,2], [0,3], [0,4], [0,5],
  [1,2], [1,3], [1,4], [1,5],
  [2,4], [4,3], [3,5], [5,2],
];

type ShapeType = 'cube' | 'pyramid' | 'octahedron';

const SHAPES: Record<ShapeType, { vertices: Vec3[]; edges: [number, number][] }> = {
  cube: { vertices: CUBE_VERTICES, edges: CUBE_EDGES },
  pyramid: { vertices: PYRAMID_VERTICES, edges: PYRAMID_EDGES },
  octahedron: { vertices: OCTAHEDRON_VERTICES, edges: OCTAHEDRON_EDGES },
};

export function Viewer3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [shape, setShape] = useState<ShapeType>('cube');
  const [autoRotate, setAutoRotate] = useState(true);
  const [scale, setScale] = useState(80);
  const { theme } = useThemeStore();

  const accent = theme.colors.accent;
  const accentGlow = theme.colors.accentGlow;
  const textSecondary = theme.colors.textSecondary;
  const textTertiary = theme.colors.textTertiary;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    let isVisible = true;
    const handleVisibility = () => { isVisible = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', handleVisibility);

    let lastTime = 0;
    const FRAME_INTERVAL = 33; // ~30fps

    let angleX = 0.3;
    let angleY = 0.5;
    let angleZ = 0;
    let dragging = false;
    let lastMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      dragging = true;
      lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      angleY += dx * 0.01;
      angleX += dy * 0.01;
      lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { dragging = false; };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const { vertices, edges } = SHAPES[shape];

    const animate = (timestamp: number) => {
      animRef.current = requestAnimationFrame(animate);
      if (!isVisible) return;
      if (timestamp - lastTime < FRAME_INTERVAL) return;
      lastTime = timestamp;

      if (autoRotate && !dragging) {
        angleY += 0.016;
        angleX += 0.008;
      }

      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = theme.colors.accentGlow03;
      ctx.lineWidth = 0.5;
      for (let i = -5; i <= 5; i++) {
        const p1 = project(rotateY(rotateX({ x: i * 40, y: 0, z: -200 }, 0), 0), cx, cy + 60, 1);
        const p2 = project(rotateY(rotateX({ x: i * 40, y: 0, z: 200 }, 0), 0), cx, cy + 60, 1);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();

        const p3 = project(rotateY(rotateX({ x: -200, y: 0, z: i * 40 }, 0), 0), cx, cy + 60, 1);
        const p4 = project(rotateY(rotateX({ x: 200, y: 0, z: i * 40 }, 0), 0), cx, cy + 60, 1);
        ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
      }

      // Transform vertices
      const transformed = vertices.map((v) => {
        let p = rotateX(v, angleX);
        p = rotateY(p, angleY);
        p = rotateZ(p, angleZ);
        return project(p, cx, cy, scale);
      });

      // Draw edges
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 6;
      edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(transformed[a].x, transformed[a].y);
        ctx.lineTo(transformed[b].x, transformed[b].y);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Draw vertices
      ctx.fillStyle = accent;
      transformed.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

    };

    animate(0);

    return () => {
      cancelAnimationFrame(animRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [shape, autoRotate, scale, accent, accentGlow]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 3, border: `1px solid ${theme.colors.accentGlow06}` }}>
        {(['cube', 'pyramid', 'octahedron'] as ShapeType[]).map((s) => (
          <button
            key={s}
            onClick={() => setShape(s)}
            style={{
              padding: '3px 10px',
              borderRadius: 3,
              border: shape === s ? `1px solid ${theme.colors.accentGlow30}` : `1px solid ${theme.colors.accentGlow08}`,
              background: shape === s ? accentGlow : 'transparent',
              color: shape === s ? accent : textTertiary,
              cursor: 'default',
              fontSize: 10,
              fontFamily: theme.font.ui,
              textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        ))}
        <div style={{ width: 1, height: 16, background: theme.colors.accentGlow10 }} />
        <button
          onClick={() => setAutoRotate((v) => !v)}
          style={{
            padding: '3px 10px',
            borderRadius: 3,
            border: `1px solid ${autoRotate ? theme.colors.accentGlow30 : theme.colors.accentGlow08}`,
            background: autoRotate ? accentGlow : 'transparent',
            color: autoRotate ? accent : textTertiary,
            cursor: 'default',
            fontSize: 10,
            fontFamily: theme.font.ui,
          }}
        >
          {autoRotate ? '⏸ Pause' : '▶ Rotate'}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: textTertiary }}>Scale</span>
          <input
            type="range"
            min={40}
            max={150}
            step={5}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            style={{ width: 80, accentColor: accent, cursor: 'default' }}
          />
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', background: 'rgba(0,0,0,0.15)', borderRadius: 4, border: `1px solid ${theme.colors.accentGlow06}` }}>
        <canvas ref={canvasRef} width={700} height={450} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
        <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 9, color: textTertiary, fontFamily: theme.font.mono }}>
          Drag to rotate
        </div>
      </div>
    </div>
  );
}
