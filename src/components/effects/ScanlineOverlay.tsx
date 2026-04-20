interface ScanlineOverlayProps {
  intensity?: number;
  color?: string;
  disableAnimation?: boolean;
}

export function ScanlineOverlay({ intensity = 0.6, color = '#00f0ff', disableAnimation = false }: ScanlineOverlayProps) {
  const rgb = hexToRgb(color);
  return (
    <>
      {/* Horizontal scanlines */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          opacity: intensity,
        }}
      />
      {/* Scan beam */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          width: '100%',
          height: 4,
          zIndex: 9998,
          pointerEvents: 'none',
          background: `linear-gradient(180deg, transparent, rgba(${rgb.r},${rgb.g},${rgb.b},0.04), transparent)`,
          animation: disableAnimation ? 'none' : 'vioScanBeam 6s linear infinite',
        }}
      />
    </>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}
