import type { TerminalType } from '../../types';
import { useThemeStore } from '../../core/theme-engine/themeStore';

interface LauncherProps {
  visible: boolean;
  onSelect: (type: TerminalType) => void;
  onClose: () => void;
}

const TERMINAL_ITEMS: { type: TerminalType; name: string; icon: string }[] = [
  { type: 'system-monitor', name: 'System Monitor', icon: '◈' },
  { type: 'shell', name: 'Shell', icon: '▸' },
  { type: 'log-viewer', name: 'Log Viewer', icon: '≡' },
  { type: 'file-manager', name: 'File Manager', icon: '▣' },
  { type: 'network-map', name: 'Network Map', icon: '◉' },
  { type: 'code-editor', name: 'Code Editor', icon: '◊' },
  { type: 'map', name: 'Map', icon: '◎' },
  { type: 'media-player', name: 'Media', icon: '▶' },
];

export function Launcher({ visible, onSelect, onClose }: LauncherProps) {
  const { theme } = useThemeStore();
  if (!visible) return null;

  const accent = theme.colors.accent;
  const accentDim = theme.colors.accentDim;
  const accentGlow = theme.colors.accentGlow;
  const textPrimary = theme.colors.textPrimary;
  const textSecondary = theme.colors.textSecondary;
  const textTertiary = theme.colors.textTertiary;
  const bgSecondary = theme.colors.bgSecondary;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        maxHeight: 400,
        background: bgSecondary + 'f2',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${accentDim.replace('0.3', '0.2')}`,
        borderRadius: 6,
        boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 20px ${accentGlow}`,
        zIndex: 2000,
        overflow: 'hidden',
      }}
    >
      <input
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          borderBottom: `1px solid ${accentDim.replace('0.3', '0.1')}`,
          color: textPrimary,
          fontSize: 14,
          outline: 'none',
          fontFamily: theme.font.mono,
        }}
        placeholder="Type to search terminal..."
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 16 }}>
        {TERMINAL_ITEMS.map((item, idx) => (
          <div
            key={item.type}
            onClick={() => onSelect(item.type)}
            style={{
              padding: '16px 12px',
              textAlign: 'center',
              border: `1px solid ${accentDim.replace('0.3', '0.08')}`,
              borderRadius: 4,
              cursor: 'default',
              transition: 'all 0.15s',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = accentDim.replace('0.3', '0.3');
              e.currentTarget.style.background = accentGlow;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = accentDim.replace('0.3', '0.08');
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {/* Shortcut number badge */}
            <div
              style={{
                position: 'absolute',
                top: 4,
                right: 6,
                fontSize: 9,
                color: textTertiary,
                fontFamily: theme.font.mono,
              }}
            >
              {idx + 1}
            </div>
            <div
              style={{
                width: 32,
                height: 32,
                margin: '0 auto 8px',
                border: `1px solid ${accentDim.replace('0.3', '0.2')}`,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                color: accent,
              }}
            >
              {item.icon}
            </div>
            <div style={{ fontSize: 11, color: textSecondary, fontFamily: theme.font.ui, letterSpacing: 1 }}>
              {item.name}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          padding: '6px 12px',
          borderTop: `1px solid ${accentDim.replace('0.3', '0.08')}`,
          fontSize: 9,
          color: textTertiary,
          fontFamily: theme.font.mono,
          textAlign: 'center',
        }}
      >
        Press 1~8 to select · Escape to close · Ctrl+T to toggle
      </div>
    </div>
  );
}
