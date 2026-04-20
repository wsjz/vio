import { Component, type ReactNode, type ErrorInfo } from 'react';
import { useThemeStore } from '../../core/theme-engine/themeStore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[VIO ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { theme } = useThemeStore();

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: theme.font.mono,
        color: theme.colors.textSecondary,
      }}
    >
      <div
        style={{
          fontSize: 32,
          color: '#ff3333',
          marginBottom: 12,
          textShadow: '0 0 10px rgba(255,51,51,0.4)',
        }}
      >
        ⚠ ERROR
      </div>
      <div style={{ fontSize: 12, color: theme.colors.textTertiary, marginBottom: 16, textAlign: 'center' }}>
        Terminal component crashed unexpectedly.
      </div>
      {error && (
        <pre
          style={{
            background: 'rgba(255,51,51,0.05)',
            border: '1px solid rgba(255,51,51,0.15)',
            borderRadius: 4,
            padding: 10,
            fontSize: 10,
            color: '#ff6666',
            maxWidth: '100%',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            marginBottom: 16,
          }}
        >
          {error.message}
        </pre>
      )}
      <button
        onClick={onReset}
        style={{
          padding: '6px 16px',
          background: 'rgba(0,240,255,0.1)',
          border: `1px solid ${theme.colors.accentDim}`,
          borderRadius: 3,
          color: theme.colors.accent,
          fontSize: 11,
          fontFamily: theme.font.mono,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        [ RESET TERMINAL ]
      </button>
    </div>
  );
}
