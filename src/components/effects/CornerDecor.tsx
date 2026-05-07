// src/components/effects/CornerDecor.tsx

import { useThemeStore } from '../../core/theme-engine/themeStore';

interface CornerDecorProps {
  position: 'tl' | 'tr' | 'bl' | 'br';
  isFocused?: boolean;
  size?: number;
}

export function CornerDecor({ position, isFocused = false, size = 12 }: CornerDecorProps) {
  const { theme } = useThemeStore();
  const accent = theme.colors.accent;

  const lineBg = isFocused ? accent : `${accent}26`;
  const lineGlow = isFocused ? `0 0 6px ${theme.colors.accentGlow25}` : 'none';

  const isTop = position.startsWith('t');
  const isLeft = position.endsWith('l');

  const hStyle: React.CSSProperties = {
    position: 'absolute',
    width: size - 2,
    height: 1,
    background: lineBg,
    boxShadow: lineGlow,
    transition: 'all 0.3s ease',
    top: isTop ? 0 : undefined,
    bottom: isTop ? undefined : 0,
    left: isLeft ? 0 : undefined,
    right: isLeft ? undefined : 0,
  };

  const vStyle: React.CSSProperties = {
    position: 'absolute',
    width: 1,
    height: size - 2,
    background: lineBg,
    boxShadow: lineGlow,
    transition: 'all 0.3s ease',
    top: isTop ? 0 : undefined,
    bottom: isTop ? undefined : 0,
    left: isLeft ? 0 : undefined,
    right: isLeft ? undefined : 0,
  };

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease',
    top: isTop ? 4 : undefined,
    bottom: isTop ? undefined : 4,
    left: isLeft ? 4 : undefined,
    right: isLeft ? undefined : 4,
  };

  return (
    <div style={posStyle}>
      <div style={hStyle} />
      <div style={vStyle} />
    </div>
  );
}
