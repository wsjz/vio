// src/components/layout/NotificationPanel.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { slideFromRight, staggerContainer, staggerItem } from '../../lib/animations';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

interface NotificationPanelProps {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
  onClear: () => void;
  onDismiss: (id: string) => void;
}

export function NotificationPanel({ visible, notifications, onClose, onClear, onDismiss }: NotificationPanelProps) {
  const { theme } = useThemeStore();

  const typeColors = {
    info: theme.colors.accent,
    warning: '#ffb000',
    error: '#ff3333',
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 199,
              background: 'rgba(0,0,0,0.3)',
            }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={slideFromRight}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 320,
              height: 'calc(100vh - 36px)',
              zIndex: 200,
              background: `${theme.colors.bgSecondary}cc`,
              backdropFilter: 'blur(20px) saturate(140%)',
              borderLeft: `0.5px solid ${theme.colors.borderDefault}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${theme.colors.borderDefault}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: theme.colors.textSecondary,
                    fontFamily: theme.font.mono,
                  }}
                >
                  Notifications
                </span>
                {notifications.length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      background: theme.colors.accentGlow15,
                      color: theme.colors.accent,
                      fontFamily: theme.font.mono,
                    }}
                  >
                    {notifications.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClear}
                style={{
                  fontSize: 10,
                  color: theme.colors.textTertiary,
                  fontFamily: theme.font.mono,
                  cursor: 'default',
                  letterSpacing: 1,
                }}
              >
                Clear All
              </button>
            </div>

            {/* List */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              style={{ flex: 1, overflow: 'auto', padding: 12 }}
            >
              {notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 40,
                    color: theme.colors.textTertiary,
                    fontSize: 12,
                    fontFamily: theme.font.mono,
                  }}
                >
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    variants={staggerItem}
                    layout
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 12,
                      marginBottom: 8,
                      borderRadius: 8,
                      background: theme.colors.bgPrimary + '80',
                      border: `1px solid ${theme.colors.borderDefault}`,
                      position: 'relative',
                    }}
                  >
                    {/* Color bar */}
                    <div
                      style={{
                        width: 3,
                        borderRadius: 2,
                        background: typeColors[n.type],
                        flexShrink: 0,
                      }}
                    />
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: theme.colors.textPrimary,
                          fontFamily: theme.font.ui,
                          marginBottom: 4,
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: theme.colors.textTertiary,
                          fontFamily: theme.font.mono,
                          marginBottom: 4,
                        }}
                      >
                        {n.timestamp.toLocaleTimeString()}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: theme.colors.textSecondary,
                          fontFamily: theme.font.ui,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {n.message}
                      </div>
                    </div>
                    {/* Dismiss */}
                    <button
                      onClick={() => onDismiss(n.id)}
                      style={{
                        color: theme.colors.textTertiary,
                        fontSize: 14,
                        lineHeight: 1,
                        cursor: 'default',
                        padding: 4,
                      }}
                    >
                      ×
                    </button>
                  </motion.div>
                ))
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
