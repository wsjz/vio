import { useCallback, useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  onClick: () => void;
  divider?: boolean;
}

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
  theme: {
    colors: {
      bgSecondary: string;
      accent: string;
      accentDim: string;
      accentGlow: string;
      textPrimary: string;
      textSecondary: string;
      borderDefault: string;
      accentDim15: string;
      accentGlow10: string;
      accentGlow12: string;
    };
    font: { mono: string };
  };
}

export function ContextMenu({ visible, x, y, items, onClose, theme }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [visible, onClose]);

  const handleItemClick = useCallback(
    (onClick: () => void) => {
      onClick();
      onClose();
    },
    [onClose]
  );

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 9999,
        minWidth: 160,
        background: theme.colors.bgSecondary + 'f0',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${theme.colors.borderDefault}`,
        borderRadius: 6,
        padding: '4px 0',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 16px ${theme.colors.accentGlow10}`,
        fontFamily: theme.font.mono,
        fontSize: 12,
        overflow: 'hidden',
      }}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div
            key={i}
            style={{
              height: 1,
              background: theme.colors.accentDim15,
              margin: '4px 8px',
            }}
          />
        ) : (
          <button
            key={i}
            onClick={() => handleItemClick(item.onClick)}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 16px',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              color: theme.colors.textPrimary,
              fontFamily: theme.font.mono,
              fontSize: 12,
              cursor: 'default',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = theme.colors.accentGlow12;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
