import { useEffect, useRef, useState } from 'react';
import { useThemeStore } from '../../core/theme-engine/themeStore';

interface MapNode {
  x: number;
  y: number;
  label: string;
  type: 'city' | 'outpost' | 'waypoint';
}

interface MapConnection {
  from: number;
  to: number;
}

function generateMap(): { nodes: MapNode[]; connections: MapConnection[] } {
  const nodes: MapNode[] = [];
  const cities = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
  for (let i = 0; i < 20; i++) {
    nodes.push({
      x: Math.random() * 800,
      y: Math.random() * 500,
      label: i < cities.length ? cities[i] : `WP-${i - cities.length + 1}`,
      type: i < cities.length ? 'city' : Math.random() > 0.5 ? 'outpost' : 'waypoint',
    });
  }

  const connections: MapConnection[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180 && Math.random() > 0.4) {
        connections.push({ from: i, to: j });
      }
    }
  }
  return { nodes, connections };
}

export function MapViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [mapData, setMapData] = useState(() => generateMap());
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [hoverNode, setHoverNode] = useState<number | null>(null);
  const { theme } = useThemeStore();

  const accent = theme.colors.accent;
  const accentDim = theme.colors.accentDim;
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
    const { nodes, connections } = mapData;

    let isVisible = true;
    const handleVisibility = () => { isVisible = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', handleVisibility);

    let lastTime = 0;
    const FRAME_INTERVAL = 33; // ~30fps

    let t = 0;
    const animate = (timestamp: number) => {
      animRef.current = requestAnimationFrame(animate);
      if (!isVisible) return;
      if (timestamp - lastTime < FRAME_INTERVAL) return;
      lastTime = timestamp;

      t += 0.005;
      ctx.fillStyle = theme.colors.bgPrimary + '40';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = accentGlow.replace('0.15', '0.04');
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Draw connections
      connections.forEach((conn) => {
        const a = nodes[conn.from];
        const b = nodes[conn.to];
        const isActive = selectedNode === conn.from || selectedNode === conn.to ||
                         hoverNode === conn.from || hoverNode === conn.to;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isActive ? accentDim : accentGlow.replace('0.15', '0.06');
        ctx.lineWidth = isActive ? 1.5 : 0.5;
        ctx.stroke();

        // Animated data packet on some connections
        if (isActive || Math.sin(t * 3 + conn.from) > 0.7) {
          const packetPos = (t * 0.3 + conn.from * 0.1) % 1;
          const px = a.x + (b.x - a.x) * packetPos;
          const py = a.y + (b.y - a.y) * packetPos;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = accent;
          ctx.fill();
        }
      });

      // Draw nodes
      nodes.forEach((node, i) => {
        const isSelected = selectedNode === i;
        const isHover = hoverNode === i;
        const pulse = Math.sin(t * 2 + i) * 2;

        let radius = 4;
        let glow = accentGlow;
        if (node.type === 'city') { radius = 7; glow = accentGlow.replace('0.15', '0.2'); }
        else if (node.type === 'outpost') { radius = 5; }

        // Glow ring
        if (isSelected || isHover) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 6 + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = accentGlow.replace('0.15', '0.15');
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Node body
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? accent : accentGlow.replace('0.15', '0.3');
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Label
        if (isSelected || isHover || node.type === 'city') {
          ctx.fillStyle = isSelected || isHover ? accent : textTertiary;
          ctx.font = `9px "${theme.font.mono}", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y - radius - 6);
        }
      });

      // Scan line effect
      const scanY = (t * 80) % (H + 100) - 50;
      ctx.fillStyle = accentGlow.replace('0.15', '0.12');
      ctx.fillRect(0, scanY, W, 2);

    };

    animate(0);
    return () => {
      cancelAnimationFrame(animRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [mapData, selectedNode, hoverNode, accent, accentDim, accentGlow, textTertiary, theme.font.mono, theme.colors.bgPrimary]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    let closest = -1;
    let minDist = Infinity;
    mapData.nodes.forEach((node, i) => {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20 && dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setSelectedNode(closest >= 0 ? closest : null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    let closest = -1;
    let minDist = Infinity;
    mapData.nodes.forEach((node, i) => {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 15 && dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setHoverNode(closest >= 0 ? closest : null);
  };

  const selected = selectedNode !== null ? mapData.nodes[selectedNode] : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 3, border: `1px solid ${accentGlow.replace('0.15', '0.06')}` }}>
        <button
          onClick={() => setMapData(generateMap())}
          style={{
            padding: '3px 12px',
            borderRadius: 3,
            border: `1px solid ${accentGlow.replace('0.15', '0.2')}`,
            background: accentGlow,
            color: accent,
            cursor: 'default',
            fontSize: 10,
            fontFamily: theme.font.ui,
          }}
        >
          ⟳ Regenerate
        </button>
        <div style={{ fontSize: 9, color: textTertiary, fontFamily: theme.font.mono }}>
          Nodes: {mapData.nodes.length} | Connections: {mapData.connections.length}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 9, color: textTertiary }}>
          <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: accent, marginRight: 4 }} /> City</span>
          <span><span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: accentGlow.replace('0.15', '0.3'), marginRight: 4, border: `1px solid ${accent}` }} /> Outpost</span>
          <span><span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: accentGlow.replace('0.15', '0.2'), marginRight: 4 }} /> Waypoint</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
        {/* Map canvas */}
        <div style={{ flex: 1, position: 'relative', borderRadius: 4, border: `1px solid ${accentGlow.replace('0.15', '0.06')}`, overflow: 'hidden' }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverNode(null)}
          />
        </div>

        {/* Info panel */}
        <div style={{ width: 140, padding: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 4, border: `1px solid ${accentGlow.replace('0.15', '0.06')}`, fontSize: 10 }}>
          <div style={{ fontSize: 9, color: textTertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: theme.font.ui }}>
            Node Info
          </div>
          {selected ? (
            <div>
              <div style={{ color: accent, fontSize: 14, fontWeight: 700, fontFamily: theme.font.display, marginBottom: 4 }}>
                {selected.label}
              </div>
              <div style={{ color: textSecondary, marginBottom: 4 }}>Type: <span style={{ color: accent }}>{selected.type}</span></div>
              <div style={{ color: textTertiary, fontFamily: theme.font.mono, fontSize: 9 }}>
                X: {selected.x.toFixed(0)}<br />
                Y: {selected.y.toFixed(0)}
              </div>
              <div style={{ marginTop: 8, color: textTertiary, fontSize: 9 }}>
                Links: {mapData.connections.filter((c) => c.from === selectedNode || c.to === selectedNode).length}
              </div>
            </div>
          ) : (
            <div style={{ color: textTertiary }}>Click a node to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}
