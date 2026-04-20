import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { getSystemLogs, type SystemLogEntry } from '../../api/tauri';
import type { ThemeConfig } from '../../types';

const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

const LEVEL_COLORS: Record<string, { color: string; bg: string }> = {
  INFO:  { color: '#00ff41', bg: 'rgba(0,255,65,0.06)' },
  DEBUG: { color: '#808080', bg: 'rgba(128,128,128,0.04)' },
  WARN:  { color: '#ffb000', bg: 'rgba(255,176,0,0.06)' },
  ERROR: { color: '#ff3333', bg: 'rgba(255,51,51,0.06)' },
  FATAL: { color: '#ff0066', bg: 'rgba(255,0,102,0.08)' },
};

const DEMO_LOGS: SystemLogEntry[] = [
  { timestamp: new Date().toISOString(), level: 'INFO', source: 'vio', message: 'System initialized successfully' },
  { timestamp: new Date(Date.now()-30000).toISOString(), level: 'DEBUG', source: 'kernel', message: 'Memory allocation: 512MB' },
  { timestamp: new Date(Date.now()-60000).toISOString(), level: 'WARN', source: 'network', message: 'Latency spike detected: 245ms' },
  { timestamp: new Date(Date.now()-90000).toISOString(), level: 'ERROR', source: 'fs', message: 'Permission denied: /etc/shadow' },
  { timestamp: new Date(Date.now()-120000).toISOString(), level: 'INFO', source: 'vio', message: 'Service heartbeat: OK' },
  { timestamp: new Date(Date.now()-180000).toISOString(), level: 'DEBUG', source: 'kernel', message: 'CPU throttling: core 3 @ 2.4GHz' },
  { timestamp: new Date(Date.now()-240000).toISOString(), level: 'WARN', source: 'security', message: 'Unusual login attempt from 192.168.1.99' },
  { timestamp: new Date(Date.now()-300000).toISOString(), level: 'INFO', source: 'vio', message: 'Network scan completed: 24 devices' },
  { timestamp: new Date(Date.now()-360000).toISOString(), level: 'ERROR', source: 'gpu', message: 'Driver reset required' },
  { timestamp: new Date(Date.now()-420000).toISOString(), level: 'FATAL', source: 'kernel', message: 'Kernel panic - not syncing: VFS' },
];

interface LogStats {
  total: number;
  info: number;
  warn: number;
  error: number;
}

function computeStats(logs: SystemLogEntry[]): LogStats {
  let info = 0, warn = 0, error = 0;
  for (const l of logs) {
    if (l.level === 'INFO') info++;
    else if (l.level === 'WARN') warn++;
    else if (l.level === 'ERROR' || l.level === 'FATAL') error++;
  }
  return { total: logs.length, info, warn, error };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('zh-CN', { hour12: false });
}

// Memoized log row component to prevent re-render of unchanged rows
const LogRow = memo(function LogRow({ log, theme }: { log: SystemLogEntry; theme: ThemeConfig }) {
  const style = LEVEL_COLORS[log.level] || LEVEL_COLORS.DEBUG;
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 1,
        padding: '2px 6px',
        borderRadius: 2,
        background: style.bg,
        fontFamily: theme.font.mono,
        fontSize: 10,
        alignItems: 'flex-start',
        wordBreak: 'break-word',
      }}
    >
      <span style={{ color: theme.colors.textTertiary, whiteSpace: 'nowrap', minWidth: 60, flexShrink: 0 }}>
        {formatTime(log.timestamp)}
      </span>
      <span
        style={{
          color: style.color,
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          minWidth: 44,
          flexShrink: 0,
          textShadow: `0 0 6px ${style.color}40`,
        }}
      >
        {log.level}
      </span>
      <span style={{ color: theme.colors.textTertiary, whiteSpace: 'nowrap', minWidth: 60, flexShrink: 0 }}>
        [{log.source}]
      </span>
      <span style={{ color: theme.colors.textSecondary, flex: 1 }}>{log.message}</span>
    </div>
  );
});

export function LogViewer() {
  const { theme } = useThemeStore();
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [source, setSource] = useState<'system' | 'kernel'>('system');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_LOGS = 500;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      if (isTauri) {
        const result = await getSystemLogs({ source, limit: 200 });
        setLogs(result.slice(-MAX_LOGS));
      } else {
        setLogs(DEMO_LOGS.slice(-MAX_LOGS));
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (!autoRefresh) return;

    intervalRef.current = setInterval(loadLogs, 5000);

    const handleVisibility = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (document.visibilityState === 'visible' && autoRefresh) {
        loadLogs();
        intervalRef.current = setInterval(loadLogs, 5000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [autoRefresh, loadLogs]);

  const filtered = useMemo(() => {
    const lower = filter.toLowerCase().trim();
    if (!lower) return logs;
    return logs.filter((l) =>
      l.message.toLowerCase().includes(lower) ||
      l.level.toLowerCase().includes(lower) ||
      l.source.toLowerCase().includes(lower)
    );
  }, [logs, filter]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const handleRefresh = useCallback(() => loadLogs(), [loadLogs]);

  const handleClear = useCallback(() => {
    setLogs([]);
    setFilter('');
  }, []);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  }, []);

  const handleSourceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSource(e.target.value as 'system' | 'kernel');
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((v) => !v);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: theme.font.mono }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderBottom: `1px solid ${theme.colors.borderDefault}`,
          background: 'rgba(0,0,0,0.15)',
          flexShrink: 0,
        }}
      >
        <select
          value={source}
          onChange={handleSourceChange}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${theme.colors.borderDefault}`,
            borderRadius: 3,
            color: theme.colors.textSecondary,
            fontSize: 11,
            fontFamily: theme.font.mono,
            padding: '4px 8px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="system">System</option>
          <option value="kernel">Kernel</option>
        </select>

        <input
          value={filter}
          onChange={handleFilterChange}
          placeholder="Filter logs..."
          style={{
            flex: 1,
            padding: '4px 10px',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${theme.colors.borderDefault}`,
            borderRadius: 3,
            color: theme.colors.textSecondary,
            fontSize: 11,
            fontFamily: theme.font.mono,
            outline: 'none',
          }}
        />

        <button
          onClick={toggleAutoRefresh}
          style={{
            padding: '4px 10px',
            background: autoRefresh ? theme.colors.accentDim : 'rgba(0,0,0,0.3)',
            border: `1px solid ${autoRefresh ? theme.colors.accent : theme.colors.borderDefault}`,
            borderRadius: 3,
            color: autoRefresh ? theme.colors.accent : theme.colors.textTertiary,
            fontSize: 10,
            fontFamily: theme.font.mono,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {autoRefresh ? '● Auto' : '○ Manual'}
        </button>

        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '4px 10px',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${theme.colors.borderDefault}`,
            borderRadius: 3,
            color: theme.colors.textSecondary,
            fontSize: 10,
            fontFamily: theme.font.mono,
            cursor: 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? '...' : '↻'}
        </button>

        <button
          onClick={handleClear}
          style={{
            padding: '4px 10px',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${theme.colors.borderDefault}`,
            borderRadius: 3,
            color: theme.colors.textTertiary,
            fontSize: 10,
            fontFamily: theme.font.mono,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '4px 10px',
          borderBottom: `1px solid ${theme.colors.borderDefault}`,
          background: 'rgba(0,0,0,0.1)',
          fontSize: 10,
          color: theme.colors.textTertiary,
          flexShrink: 0,
        }}
      >
        <span>TOTAL: <b style={{ color: theme.colors.textSecondary }}>{stats.total}</b></span>
        <span>INFO: <b style={{ color: LEVEL_COLORS.INFO.color }}>{stats.info}</b></span>
        <span>WARN: <b style={{ color: LEVEL_COLORS.WARN.color }}>{stats.warn}</b></span>
        <span>ERR: <b style={{ color: LEVEL_COLORS.ERROR.color }}>{stats.error}</b></span>
      </div>

      {/* Log list */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '6px 10px',
          fontSize: 10,
          lineHeight: 1.8,
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ color: theme.colors.textTertiary, textAlign: 'center', marginTop: 40 }}>
            {loading ? 'Reading system logs...' : 'No logs match the filter'}
          </div>
        ) : (
          filtered.map((log, i) => (
            <LogRow key={`${log.timestamp}-${i}`} log={log} theme={theme} />
          ))
        )}
      </div>
    </div>
  );
}
