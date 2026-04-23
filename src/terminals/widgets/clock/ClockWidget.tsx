import { useState, useEffect } from 'react';
import { useThemeStore } from '../../../core/theme-engine/themeStore';

export function ClockWidget() {
  const [now, setNow] = useState(new Date());
  const { theme } = useThemeStore();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const accent = theme.colors.accent;
  const accentDim = theme.colors.accentDim;
  const accentGlow = theme.colors.accentGlow;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: accent,
          fontFamily: theme.font.display,
          textShadow: `0 0 10px ${accentGlow}`,
          letterSpacing: 2,
        }}
      >
        {timeStr}
      </div>
      <div style={{ fontSize: 10, color: theme.colors.textTertiary, fontFamily: theme.font.mono, letterSpacing: 1 }}>
        {dateStr}
      </div>
      <div style={{ marginTop: 4, display: 'flex', gap: 2 }}>
        {Array.from({ length: 60 }).map((_, i) => {
          const active = i <= now.getSeconds();
          return (
            <div
              key={i}
              style={{
                width: 2,
                height: 3,
                background: active ? accent : theme.colors.accentDim10,
                borderRadius: 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
