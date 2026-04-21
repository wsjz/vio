import { useState, useEffect } from 'react';
import type { WindowState } from '../../types';
import { useWindowStore } from '../../core/window-manager/windowStore';
import { useThemeStore } from '../../core/theme-engine/themeStore';

interface TaskBarProps {
  onToggleLauncher: () => void;
  windows: WindowState[];
  onFocusWindow: (id: string) => void;
  onBlurAll?: () => void;
}

export function TaskBar({ onToggleLauncher, windows, onFocusWindow, onBlurAll }: TaskBarProps) {
  const createWindow = useWindowStore((s) => s.createWindow);
  const toggleMinimize = useWindowStore((s) => s.toggleMinimize);
  const { theme } = useThemeStore();
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        bottom: 0,
        left: 0,
        right: 0,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        zIndex: 1000,
        background: bgSecondary + 'eb',
        backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${accentDim.replace('0.3', '0.1')}`,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onBlurAll) onBlurAll();
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 3,
          color: accent,
          textShadow: `0 0 10px ${accentGlow.replace('0.15', '0.4')}`,
          fontFamily: theme.font.display,
        }}
      >
        VIO
      </div>
      <div style={{ width: 1, height: 18, background: accentDim }} />
      <button
        onClick={onToggleLauncher}
        style={{
          padding: '4px 12px',
          fontSize: 11,
          color: accent,
          border: `1px solid ${accentDim.replace('0.3', '0.3')}`,
          borderRadius: 3,
          background: accentGlow,
          cursor: 'default',
          fontFamily: theme.font.ui,
          letterSpacing: 1,
        }}
      >
        ⊕ New Terminal
      </button>
      {windows.map((win) => (
        <button
          key={win.id}
          onClick={() => {
            if (win.isMinimized) {
              toggleMinimize(win.id);
            }
            onFocusWindow(win.id);
          }}
          style={{
            padding: '4px 12px',
            fontSize: 11,
            borderRadius: 3,
            cursor: 'default',
            fontFamily: theme.font.ui,
            letterSpacing: 1,
            color: win.isFocused && !win.isMinimized ? accent : win.isMinimized ? textTertiary : textSecondary,
            border: win.isFocused && !win.isMinimized ? `1px solid ${accentDim.replace('0.3', '0.3')}` : '1px solid transparent',
            background: win.isFocused && !win.isMinimized ? accentGlow : 'transparent',
            opacity: win.isMinimized ? 0.5 : 1,
            textDecoration: win.isMinimized ? 'line-through' : 'none',
          }}
        >
          {win.title}
        </button>
      ))}
      <button
        onClick={() => createWindow('settings')}
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
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = accent; e.currentTarget.style.borderColor = accentDim.replace('0.3', '0.2'); }}
        onMouseLeave={(e) => { e.currentTarget.style.color = textSecondary; e.currentTarget.style.borderColor = 'transparent'; }}
      >
        ⚙ Settings
      </button>
      <div style={{ marginLeft: 'auto', fontFamily: theme.font.mono, fontSize: 12, letterSpacing: 1, color: textTertiary }}>
        {time}
      </div>
    </div>
  );
}
