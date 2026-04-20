interface StartupScreenProps {
  visible: boolean;
}

export function StartupScreen({ visible }: StartupScreenProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050508',
        animation: 'fade-out 0.8s ease 2.2s forwards',
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 'bold',
          letterSpacing: 12,
          color: '#00f0ff',
          textShadow: '0 0 20px rgba(0,240,255,0.4), 0 0 40px rgba(0,240,255,0.2)',
          fontFamily: 'Orbitron, sans-serif',
        }}
      >
        V I O
      </div>
      <div
        style={{ marginTop: 32, width: 200, height: 2, borderRadius: '9999px', overflow: 'hidden', background: 'rgba(0,240,255,0.1)' }}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            background: 'linear-gradient(90deg, transparent, #00f0ff, transparent)',
            boxShadow: '0 0 10px rgba(0,240,255,0.5)',
            animation: 'startup-progress 2s ease forwards',
          }}
        />
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 11,
          letterSpacing: 4,
          color: '#606060',
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
        }}
      >
        Initializing System...
      </div>

      <style>{`
        @keyframes fade-out {
          to { opacity: 0; pointer-events: none; }
        }
        @keyframes startup-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
