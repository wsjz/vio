import { useEffect, useRef, useState, memo } from 'react';
import { getSystemMetrics, getProcesses, type SystemMetrics, type ProcessInfo } from '../../api/tauri';
import { useThemeStore } from '../../core/theme-engine/themeStore';

const IS_TAURI = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function statusColor(status: string): string {
  switch (status) {
    case 'Running': return '#00ff41';
    case 'Sleeping': return '#606060';
    case 'Stopped': return '#ffb000';
    case 'Zombie': return '#ff3333';
    default: return '#a0a0a0';
  }
}

interface GaugeProps {
  label: string;
  value: number;
  color: string;
  accentGlow: string;
  fontDisplay: string;
  fontUi: string;
}

const Gauge = memo(function Gauge({ label, value, color, accentGlow, fontDisplay, fontUi }: GaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h - 4;
    const r = w / 2 - 6;

    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 4;
    ctx.stroke();

    const endAngle = Math.PI + (Math.PI * value) / 100;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [value, color]);

  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: '#606060', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, fontFamily: fontUi }}>
        {label}
      </div>
      <canvas ref={canvasRef} width={80} height={42} style={{ margin: '0 auto', display: 'block' }} />
      <div style={{ marginTop: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color, textShadow: `0 0 10px ${accentGlow}`, fontFamily: fontDisplay }}>
          {value.toFixed(1)}
        </span>
        <span style={{ fontSize: 10, color: '#606060', marginLeft: 2 }}>%</span>
      </div>
      <div style={{ width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 4, background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(value, 100)}%`, background: `linear-gradient(90deg,${color}40,${color})`, boxShadow: `0 0 6px ${accentGlow}`, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
});

const NetworkChart = memo(function NetworkChart({ data, accent, accentGlow }: { data: number[]; accent: string; accentGlow: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) return;

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (h / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.beginPath();
    const step = w / (data.length - 1);
    data.forEach((val, i) => {
      const x = i * step;
      const y = h - (val / 100) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = accent + '80';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = accentGlow;
    ctx.fill();
  }, [data, accent, accentGlow]);

  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 3, border: `1px solid ${accentGlow.replace('0.15', '0.06')}`, padding: 10, marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: '#606060', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Rajdhani, sans-serif' }}>
        CPU History
      </div>
      <canvas ref={canvasRef} width={400} height={80} style={{ width: '100%', height: 80 }} />
    </div>
  );
});

export function SystemMonitor() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<number[]>(new Array(60).fill(0));
  const { theme } = useThemeStore();

  const accent = theme.colors.accent;
  const accentGlow = theme.colors.accentGlow;
  const textSecondary = theme.colors.textSecondary;
  const textTertiary = theme.colors.textTertiary;

  useEffect(() => {
    let mounted = true;
    let interval: ReturnType<typeof setInterval>;

    async function fetchData() {
      try {
        const [m, p] = await Promise.all([
          getSystemMetrics(),
          getProcesses(),
        ]);
        if (!mounted) return;
        setMetrics(m);
        setProcesses(p);
        setError(null);

        historyRef.current = [...historyRef.current.slice(1), m.cpu_usage];
      } catch (e) {
        if (mounted) setError(String(e));
      }
    }

    function start() {
      fetchData();
      interval = setInterval(fetchData, 2000);
    }
    function stop() {
      clearInterval(interval);
    }

    start();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        start();
      } else {
        stop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);


  const cpu = metrics?.cpu_usage ?? 0;
  const mem = metrics?.memory_usage_percent ?? 0;
  const disk = metrics?.disk_usage_percent ?? 0;

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {!IS_TAURI && (
        <div style={{ fontSize: 10, color: '#ffb000', marginBottom: 8, padding: '4px 8px', border: '1px solid rgba(255,176,0,0.2)', borderRadius: 3, background: 'rgba(255,176,0,0.05)' }}>
          ⚠ Running in browser mode — real system data unavailable
        </div>
      )}
      {error && (
        <div style={{ fontSize: 10, color: '#ff3333', marginBottom: 8 }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Gauge label="CPU" value={cpu} color={accent} accentGlow={accentGlow} fontDisplay={theme.font.display} fontUi={theme.font.ui} />
        <Gauge label="Memory" value={mem} color="#00ff41" accentGlow="rgba(0,255,65,0.15)" fontDisplay={theme.font.display} fontUi={theme.font.ui} />
        <Gauge label="Disk" value={disk} color="#ffb000" accentGlow="rgba(255,176,0,0.15)" fontDisplay={theme.font.display} fontUi={theme.font.ui} />
      </div>

      <NetworkChart data={historyRef.current} accent={accent} accentGlow={accentGlow} />

      {metrics && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 10, color: textTertiary, fontFamily: theme.font.mono }}>
          <span>Mem: {formatBytes(metrics.memory_used)} / {formatBytes(metrics.memory_total)}</span>
          <span>Disk: {formatBytes(metrics.disk_used)} / {formatBytes(metrics.disk_total)}</span>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            {['PID', 'Name', 'CPU%', 'MEM (MB)', 'Status'].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '6px 8px',
                  fontWeight: 'normal',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  color: textTertiary,
                  borderBottom: `1px solid ${accentGlow.replace('0.15', '0.1')}`,
                  fontSize: 9,
                  fontFamily: theme.font.ui,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {processes.map((p) => (
            <tr
              key={p.pid}
              style={{ transition: 'background 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = accentGlow.replace('0.15', '0.03'))}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '5px 8px', color: '#888' }}>{p.pid}</td>
              <td style={{ padding: '5px 8px', color: textSecondary, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
              <td style={{ padding: '5px 8px', color: accent }}>{p.cpu_usage.toFixed(1)}</td>
              <td style={{ padding: '5px 8px', color: textSecondary }}>{p.memory_mb.toFixed(1)}</td>
              <td style={{ padding: '5px 8px', color: statusColor(p.status) }}>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
