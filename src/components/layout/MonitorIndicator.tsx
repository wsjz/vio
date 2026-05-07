// src/components/layout/MonitorIndicator.tsx

import { motion } from 'framer-motion';
import { useThemeStore } from '../../core/theme-engine/themeStore';

interface MonitorWorkspace {
  id: string;
  name: string;
  isActive: boolean;
  containers: { id: string }[];
}

interface MonitorIndicatorProps {
  monitor: {
    id: string;
    isPrimary: boolean;
    workspaces: MonitorWorkspace[];
  };
  position?: 'bottom-left' | 'bottom-right';
}

export function MonitorIndicator({ monitor, position = 'bottom-right' }: MonitorIndicatorProps) {
  const { theme } = useThemeStore();

  const activeWorkspace = monitor.workspaces.find((w) => w.isActive);
  const totalWindows = monitor.workspaces.reduce((sum, w) => sum + w.containers.length, 0);

  const posStyle: React.CSSProperties = position === 'bottom-right'
    ? { bottom: 48, right: 16 }
    : { bottom: 48, left: 16 };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        position: 'fixed',
        ...posStyle,
        zIndex: 50,
        width: 48,
        height: 48,
        borderRadius: 8,
        background: `${theme.colors.bgSecondary}cc`,
        backdropFilter: 'blur(12px)',
        border: `0.5px solid ${monitor.isPrimary ? theme.colors.accent : theme.colors.borderDefault}`,
        boxShadow: monitor.isPrimary
          ? `0 0 12px ${theme.colors.accentGlow15}`
          : '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        cursor: 'default',
        transition: 'all 0.3s ease',
      }}
      title={`Monitor ${monitor.id}\n${activeWorkspace?.name || 'No workspace'}\n${totalWindows} windows`}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: monitor.isPrimary ? theme.colors.accent : theme.colors.textSecondary,
          fontFamily: theme.font.display,
          lineHeight: 1,
        }}
      >
        {monitor.isPrimary ? '1' : monitor.id.slice(-1)}
      </span>
      <span
        style={{
          fontSize: 8,
          color: theme.colors.textTertiary,
          fontFamily: theme.font.mono,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {activeWorkspace?.name?.slice(0, 1) || '?'}
      </span>
      {totalWindows > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: theme.colors.accent,
            color: theme.colors.bgPrimary,
            fontSize: 8,
            fontFamily: theme.font.mono,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {totalWindows}
        </span>
      )}
    </motion.div>
  );
}
