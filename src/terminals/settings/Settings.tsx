import { useState, useEffect } from 'react';
import { getSystemInfo, type SystemInfo } from '../../api/tauri';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { getTheme } from '../../core/theme-engine/themes';
import { LayoutManager } from '../../components/layout/LayoutManager';

export function Settings() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    themeName,
    theme,
    particleCount,
    scanlineIntensity,
    lowPowerMode,
    setTheme,
    setParticleCount,
    setScanlineIntensity,
    setLowPowerMode,
  } = useThemeStore();

  const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

  useEffect(() => {
    if (!isTauri) return;
    getSystemInfo()
      .then((i) => setInfo(i))
      .catch((e) => setError(String(e)));
  }, [isTauri]);

  const handleThemeChange = (name: string) => {
    const config = getTheme(name);
    setTheme(name, config);
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', fontSize: 12, color: theme.colors.textSecondary }}>
      {!isTauri && (
        <div style={{ fontSize: 10, color: '#ffb000', marginBottom: 8, padding: '4px 8px', border: '1px solid rgba(255,176,0,0.2)', borderRadius: 3, background: 'rgba(255,176,0,0.05)' }}>
          ⚠ Browser mode — some settings unavailable
        </div>
      )}
      {error && <div style={{ color: '#ff3333', fontSize: 10, marginBottom: 8 }}>{error}</div>}

      {/* System Info */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: theme.colors.textTertiary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontFamily: theme.font.ui }}>
          System Information
        </div>
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 3, border: `1px solid ${theme.colors.borderDefault}`, padding: 10 }}>
          {info ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <InfoRow label="Hostname" value={info.hostname} color={theme.colors.textSecondary} />
              <InfoRow label="OS" value={`${info.os_name} ${info.os_version}`} color={theme.colors.textSecondary} />
              <InfoRow label="Kernel" value={info.kernel_version} color={theme.colors.textSecondary} />
              <InfoRow label="CPU" value={`${info.cpu_count} cores — ${info.cpu_brand}`} color={theme.colors.textSecondary} />
            </div>
          ) : (
            <div style={{ color: theme.colors.textTertiary }}>Loading system info...</div>
          )}
        </div>
      </div>

      {/* Appearance */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: theme.colors.textTertiary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontFamily: theme.font.ui }}>
          Appearance
        </div>
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 3, border: `1px solid ${theme.colors.borderDefault}`, padding: 10 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: theme.colors.textSecondary, marginBottom: 6 }}>Theme</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['cyberpunk', 'matrix', 'amber'].map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 3,
                    border: themeName === t ? `1px solid ${theme.colors.borderFocus}` : `1px solid ${theme.colors.borderDefault}`,
                    background: themeName === t ? theme.colors.accentGlow : 'transparent',
                    color: themeName === t ? theme.colors.accent : theme.colors.textTertiary,
                    cursor: 'default',
                    fontSize: 11,
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <SliderRow
            label="Scanline Intensity"
            value={scanlineIntensity}
            min={0}
            max={1}
            step={0.1}
            onChange={setScanlineIntensity}
            accent={theme.colors.accent}
          />

          <SliderRow
            label="Particle Count"
            value={particleCount}
            min={20}
            max={200}
            step={10}
            onChange={setParticleCount}
            accent={theme.colors.accent}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <button
              onClick={() => setLowPowerMode(!lowPowerMode)}
              style={{
                width: 36,
                height: 18,
                borderRadius: 9,
                border: `1px solid ${lowPowerMode ? theme.colors.borderFocus : theme.colors.borderDefault}`,
                background: lowPowerMode ? theme.colors.accentGlow : 'transparent',
                cursor: 'default',
                position: 'relative',
                padding: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: 2,
                left: lowPowerMode ? 18 : 2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: lowPowerMode ? theme.colors.accent : theme.colors.textTertiary,
                transition: 'left 0.2s',
              }} />
            </button>
            <div>
              <div style={{ color: theme.colors.textSecondary, fontSize: 11 }}>Low Power Mode</div>
              <div style={{ color: theme.colors.textTertiary, fontSize: 9 }}>Disables particles & animations to reduce CPU usage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Manager */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: theme.colors.textTertiary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontFamily: theme.font.ui }}>
          Layout Manager
        </div>
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 3, border: `1px solid ${theme.colors.borderDefault}`, padding: 10 }}>
          <LayoutManager />
        </div>
      </div>

      {/* About */}
      <div>
        <div style={{ fontSize: 10, color: theme.colors.textTertiary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontFamily: theme.font.ui }}>
          About VIO
        </div>
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 3, border: `1px solid ${theme.colors.borderDefault}`, padding: 10 }}>
          <div style={{ color: theme.colors.accent, fontSize: 16, fontWeight: 700, fontFamily: theme.font.display, marginBottom: 4 }}>VIO Terminal</div>
          <div style={{ color: theme.colors.textTertiary, fontSize: 10 }}>Visionary Intelligence Overlay v0.1.0</div>
          <div style={{ color: theme.colors.textTertiary, fontSize: 10, marginTop: 8 }}>
            Built with React 18 + TypeScript + Tauri v2 + Rust
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: '#606060', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ color, fontSize: 11, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accent: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#888' }}>{label}</span>
        <span style={{ color: accent, fontFamily: 'Orbitron, monospace' }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: accent,
          cursor: 'default',
        }}
      />
    </div>
  );
}
