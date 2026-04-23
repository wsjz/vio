import { useState, useRef, useEffect, useCallback } from 'react';
import { useThemeStore } from '../../core/theme-engine/themeStore';

export function MediaPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [src, setSrc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeStore();

  const accent = theme.colors.accent;
  const accentGlow = theme.colors.accentGlow;
  const textSecondary = theme.colors.textSecondary;
  const textTertiary = theme.colors.textTertiary;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleError = () => setError('Failed to load video');
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  // Revoke blob URL when src changes or component unmounts
  useEffect(() => {
    return () => {
      if (src && src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((e) => setError(String(e)));
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * duration;
  }, [duration]);

  const formatTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        setSrc(URL.createObjectURL(file));
        setError(null);
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };
    input.click();
  }, []);

  const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {!isTauri && (
        <div style={{ fontSize: 10, color: '#ffb000', padding: '4px 8px', border: '1px solid rgba(255,176,0,0.2)', borderRadius: 3, background: 'rgba(255,176,0,0.05)' }}>
          ⚠ Browser mode — file picker works but limited. Use Tauri for native file dialogs.
        </div>
      )}
      {error && <div style={{ fontSize: 10, color: '#ff3333' }}>{error}</div>}

      {/* Video area */}
      <div
        style={{
          flex: 1,
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 4,
          border: `1px solid ${theme.colors.accentGlow08}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={togglePlay}
      >
        {src ? (
          <video
            ref={videoRef}
            src={src}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div style={{ textAlign: 'center', color: textTertiary }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>▶</div>
            <div style={{ fontSize: 11, fontFamily: theme.font.ui }}>No video loaded</div>
            <button
              onClick={handleFileSelect}
              style={{
                marginTop: 12,
                padding: '6px 16px',
                background: accentGlow,
                border: `1px solid ${theme.colors.accentGlow20}`,
                borderRadius: 3,
                color: accent,
                cursor: 'default',
                fontSize: 11,
                fontFamily: theme.font.ui,
              }}
            >
              Load Video
            </button>
          </div>
        )}

        {/* Center play overlay when paused */}
        {src && !isPlaying && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: `1px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: accent }}>
              ▶
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {src && (
        <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 4, border: `1px solid ${theme.colors.accentGlow06}` }}>
          {/* Progress bar */}
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            style={{
              width: '100%',
              height: 4,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 2,
              cursor: 'default',
              marginBottom: 8,
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                background: `linear-gradient(90deg,${accent}40,${accent})`,
                borderRadius: 2,
                boxShadow: `0 0 6px ${accentGlow}`,
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={togglePlay}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: accentGlow,
                border: `1px solid ${theme.colors.accentGlow30}`,
                color: accent,
                cursor: 'default',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <div style={{ fontSize: 10, color: textTertiary, fontFamily: theme.font.mono, minWidth: 70 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div style={{ flex: 1 }} />

            {/* Volume */}
            <span style={{ fontSize: 12, color: textTertiary }}>🔊</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                if (videoRef.current) videoRef.current.volume = v;
              }}
              style={{ width: 60, accentColor: accent, cursor: 'default' }}
            />

            <button
              onClick={handleFileSelect}
              style={{
                padding: '2px 10px',
                background: 'transparent',
                border: `1px solid ${accentGlow}`,
                borderRadius: 3,
                color: textSecondary,
                cursor: 'default',
                fontSize: 10,
                fontFamily: theme.font.ui,
              }}
            >
              Open
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
