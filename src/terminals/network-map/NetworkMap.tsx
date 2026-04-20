import { useEffect, useRef, useState, useCallback } from 'react';
import { getNetworkInfo, scanNetwork, type NetworkInfo, type NetworkNode } from '../../api/tauri';
import { useThemeStore } from '../../core/theme-engine/themeStore';

export function NetworkMap() {
  const [netInfo, setNetInfo] = useState<NetworkInfo | null>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const { theme } = useThemeStore();

  const accent = theme.colors.accent;
  const accentGlow = theme.colors.accentGlow;
  const textSecondary = theme.colors.textSecondary;
  const textTertiary = theme.colors.textTertiary;

  const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

  useEffect(() => {
    if (!isTauri) return;
    getNetworkInfo()
      .then((info) => setNetInfo(info))
      .catch((e) => setError(String(e)));
  }, [isTauri]);

  const handleScan = useCallback(async () => {
    if (!isTauri || !netInfo) return;
    const ip = netInfo.interfaces.flatMap((i) => i.ip).find((ip) => ip.startsWith('192.168.') || ip.startsWith('10.'));
    if (!ip) {
      setError('No local subnet found');
      return;
    }
    const subnet = ip.split('.').slice(0, 3).join('.');
    setScanning(true);
    setError(null);
    try {
      const result = await scanNetwork(subnet);
      setNodes(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setScanning(false);
    }
  }, [isTauri, netInfo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rgb = hexToRgb(accent);
    const r = rgb.r;
    const g = rgb.g;
    const b = rgb.b;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

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

      t += 0.01;
      ctx.clearRect(0, 0, W, H);

      // Draw center node (gateway/self)
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw glow ring
      ctx.beginPath();
      ctx.arc(cx, cy, 20 + Math.sin(t * 2) * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.1 + Math.sin(t * 3) * 0.05})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw discovered nodes
      nodes.forEach((node, i) => {
        const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 + t * 0.2;
        const radius = 80 + Math.sin(t + i) * 10;
        const nx = cx + Math.cos(angle) * radius;
        const ny = cy + Math.sin(angle) * radius;

        // Connection line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.1 + Math.sin(t * 2 + i) * 0.05})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Data packet animation
        const packetPos = (t * 0.5 + i * 0.3) % 1;
        const px = cx + (nx - cx) * packetPos;
        const py = cy + (ny - cy) * packetPos;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
        ctx.fill();

        // Node
        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.fillStyle = node.is_online ? 'rgba(0, 255, 65, 0.5)' : 'rgba(255, 51, 51, 0.3)';
        ctx.fill();
        ctx.strokeStyle = node.is_online ? '#00ff41' : '#ff3333';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = textSecondary;
        ctx.font = `9px "${theme.font.mono}", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(node.ip.split('.').pop() ?? '', nx, ny + 18);
      });

    };
    animate(0);
    return () => {
      cancelAnimationFrame(animRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [nodes, accent, accentGlow, textSecondary, theme.font.mono]);

  if (!isTauri) {
    return (
      <div style={{ padding: 20, color: textSecondary, fontSize: 12 }}>
        <div style={{ color: '#ffb000', marginBottom: 16, padding: '8px 12px', border: '1px solid rgba(255,176,0,0.2)', borderRadius: 3, background: 'rgba(255,176,0,0.05)' }}>
          ⚠ Browser mode — network scanning unavailable
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontSize: 12 }}>
      {error && <div style={{ color: '#ff3333', fontSize: 10, marginBottom: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 3, border: `1px solid ${accentGlow.replace('0.15', '0.06')}` }}>
        <div>
          <span style={{ color: textTertiary, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Hostname</span>
          <div style={{ color: accent, fontFamily: theme.font.ui }}>{netInfo?.hostname ?? '...'}</div>
        </div>
        <div>
          <span style={{ color: textTertiary, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Gateway</span>
          <div style={{ color: accent, fontFamily: theme.font.ui }}>{netInfo?.default_gateway ?? '...'}</div>
        </div>
        <div>
          <span style={{ color: textTertiary, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Interfaces</span>
          <div style={{ color: textSecondary }}>
            {netInfo?.interfaces.map((i) => `${i.name} (${i.ip.join(', ')})`).join('; ') ?? '...'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={handleScan}
            disabled={scanning}
            style={{
              padding: '4px 16px',
              background: scanning ? accentGlow.replace('0.15', '0.04') : accentGlow,
              border: `1px solid ${accentGlow.replace('0.15', '0.3')}`,
              borderRadius: 3,
              color: accent,
              cursor: 'default',
              fontSize: 11,
              fontFamily: theme.font.ui,
              letterSpacing: 1,
            }}
          >
            {scanning ? 'Scanning...' : '◉ Scan Network'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', background: 'rgba(0,0,0,0.15)', borderRadius: 3, border: `1px solid ${accentGlow.replace('0.15', '0.06')}` }}>
        <canvas ref={canvasRef} width={800} height={500} style={{ width: '100%', height: '100%' }} />

        <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 12, fontSize: 9, color: textTertiary }}>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: accent, marginRight: 4 }} /> Gateway</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#00ff41', marginRight: 4 }} /> Online</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ff3333', marginRight: 4 }} /> Offline</span>
        </div>

        <div style={{ position: 'absolute', top: 8, right: 8, textAlign: 'right', fontSize: 10, color: textTertiary }}>
          <div>Nodes: {nodes.length}</div>
          <div>Online: {nodes.filter((n) => n.is_online).length}</div>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}
