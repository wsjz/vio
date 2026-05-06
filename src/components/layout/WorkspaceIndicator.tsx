// src/components/layout/WorkspaceIndicator.tsx

import { useThemeStore } from '../../core/theme-engine/themeStore';
import { useVioStore } from '../../core/stores/vioStore';

export function WorkspaceIndicator() {
  const { theme } = useThemeStore();
  const { monitors, switchWorkspace } = useVioStore();

  const monitor = monitors.find((m) => m.isPrimary) || monitors[0];
  if (!monitor) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {monitor.workspaces.map((workspace) => {
        const containerCount = workspace.containers.length;
        const isActive = workspace.isActive;

        return (
          <button
            key={workspace.id}
            onClick={() => switchWorkspace(monitor.id, workspace.id)}
            title={`${workspace.name}${containerCount > 0 ? ` (${containerCount} windows)` : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 10px',
              borderRadius: 4,
              border: 'none',
              background: isActive ? theme.colors.accentGlow15 : 'transparent',
              color: isActive ? theme.colors.accent : theme.colors.textTertiary,
              fontFamily: theme.font.mono,
              fontSize: 11,
              fontWeight: isActive ? 600 : 400,
              letterSpacing: 1,
              cursor: 'default',
              transition: 'all 0.2s',
              minWidth: 32,
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = theme.colors.accentGlow08;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }
            }}
          >
            <span>{workspace.name}</span>
            {containerCount > 0 && (
              <span
                style={{
                  fontSize: 9,
                  opacity: 0.7,
                  background: theme.colors.accentDim15,
                  borderRadius: 8,
                  padding: '0 4px',
                  minWidth: 14,
                  textAlign: 'center',
                }}
              >
                {containerCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
