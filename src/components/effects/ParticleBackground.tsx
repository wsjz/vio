import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  gridX: number;
  gridY: number;
}

interface ParticleBackgroundProps {
  color?: string;
  particleCount?: number;
}

const CELL_SIZE = 120; // Must match max connection distance
const TARGET_FPS = 30;
const FRAME_INTERVAL = Math.floor(1000 / TARGET_FPS); // ~33ms

export function ParticleBackground({ color = '#00f0ff', particleCount = 80 }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasEl = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ctx2d = ctx;

    let animationId: number;
    let lastFrameTime = 0;
    let isVisible = true;
    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Visibility detection: pause when tab/app is hidden
    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.8,
        opacity: Math.random() * 0.5 + 0.3,
        gridX: 0,
        gridY: 0,
      });
    }

    const rgb = hexToRgb(color);
    const r = rgb.r;
    const g = rgb.g;
    const b = rgb.b;

    // Build spatial grid for O(n) neighbor lookups
    function buildGrid(): Map<string, Particle[]> {
      const grid = new Map<string, Particle[]>();

      for (const p of particles) {
        p.gridX = Math.floor(p.x / CELL_SIZE);
        p.gridY = Math.floor(p.y / CELL_SIZE);
        const key = `${p.gridX},${p.gridY}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key)!.push(p);
      }
      return grid;
    }

    function drawConnections(grid: Map<string, Particle[]>, p: Particle) {
      const neighbors: Particle[] = [];
      // Only check 3x3 neighborhood cells
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${p.gridX + dx},${p.gridY + dy}`;
          const cell = grid.get(key);
          if (cell) neighbors.push(...cell);
        }
      }

      for (const other of neighbors) {
        if (other === p) continue;
        const ddx = p.x - other.x;
        const ddy = p.y - other.y;
        const distSq = ddx * ddx + ddy * ddy;
        if (distSq < CELL_SIZE * CELL_SIZE) {
          const dist = Math.sqrt(distSq);
          ctx2d.beginPath();
          ctx2d.moveTo(p.x, p.y);
          ctx2d.lineTo(other.x, other.y);
          ctx2d.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(1 - dist / CELL_SIZE) * 0.08})`;
          ctx2d.lineWidth = 0.5;
          ctx2d.stroke();
        }
      }
    }

    const animate = (timestamp: number) => {
      animationId = requestAnimationFrame(animate);

      // Skip frame if not enough time elapsed (throttle to 30fps)
      if (timestamp - lastFrameTime < FRAME_INTERVAL) return;
      lastFrameTime = timestamp;

      // Skip rendering when tab is hidden
      if (!isVisible) return;

      ctx2d.clearRect(0, 0, canvasEl.width, canvasEl.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
        ctx.fill();
      }

      // O(n) spatial-grid-based connection detection instead of O(n²)
      const grid = buildGrid();
      for (const p of particles) {
        drawConnections(grid, p);
      }
    };

    animate(0);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [color, particleCount]);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}
