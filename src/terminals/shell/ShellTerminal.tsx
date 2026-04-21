import { useState, useRef, useEffect, useCallback } from 'react';
import { executeShell, type ShellResult } from '../../api/tauri';
import { useThemeStore } from '../../core/theme-engine/themeStore';

interface CommandEntry {
  id: number;
  prompt: string;
  result: ShellResult | null;
  isLoading: boolean;
}

interface ShellTerminalProps {
  isFocused?: boolean;
}

export function ShellTerminal({ isFocused }: ShellTerminalProps) {
  const [entries, setEntries] = useState<CommandEntry[]>([
    { id: 0, prompt: 'user@vio:~$', result: null, isLoading: false },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const { theme } = useThemeStore();

  // Focus input when terminal window gains focus
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  const accent = theme.colors.accent;
  const textPrimary = theme.colors.textPrimary;
  const textTertiary = theme.colors.textTertiary;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const MAX_ENTRIES = 500;
  const MAX_HISTORY = 200;

  const execute = useCallback(async (command: string) => {
    const id = nextId.current++;

    setEntries((prev) => [
      ...prev.slice(-MAX_ENTRIES + 2),
      { id, prompt: `user@vio:~$ ${command}`, result: null, isLoading: true },
    ]);

    try {
      const result = await executeShell(command);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, result, isLoading: false } : e))
      );
    } catch (e) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                result: { stdout: '', stderr: String(e), exit_code: -1 },
                isLoading: false,
              }
            : e
        )
      );
    }

    setEntries((prev) => [
      ...prev.slice(-MAX_ENTRIES + 1),
      { id: nextId.current++, prompt: 'user@vio:~$', result: null, isLoading: false },
    ]);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const cmd = input.trim();
      if (!cmd) return;

      setHistory((prev) => [...prev, cmd].slice(-MAX_HISTORY));
      setHistoryIndex(-1);
      setInput('');
      execute(cmd);
    },
    [input, execute]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHistoryIndex((idx) => {
          const newIdx = idx === -1 ? history.length - 1 : Math.max(0, idx - 1);
          setInput(history[newIdx] ?? '');
          return newIdx;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHistoryIndex((idx) => {
          if (idx === -1) return -1;
          const newIdx = idx + 1;
          if (newIdx >= history.length) {
            setInput('');
            return -1;
          }
          setInput(history[newIdx] ?? '');
          return newIdx;
        });
      }
    },
    [history]
  );

  const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

  return (
    <div style={{ fontFamily: theme.font.mono, fontSize: 12, lineHeight: 1.6, color: textTertiary, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!isTauri && (
        <div style={{ fontSize: 10, color: '#ffb000', marginBottom: 8, padding: '4px 8px', border: '1px solid rgba(255,176,0,0.2)', borderRadius: 3, background: 'rgba(255,176,0,0.05)' }}>
          ⚠ Browser mode — commands will fail. Use `npm run tauri:dev` for real shell.
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto' }}>
        {entries.map((entry, index) => (
          <div key={entry.id} style={{ marginBottom: 4 }}>
            {entry.isLoading ? (
              <div>
                <span style={{ color: accent }}>{entry.prompt}</span>
                <span style={{ display: 'inline-block', width: 8, height: 15, background: accent, verticalAlign: 'middle', marginLeft: 4, animation: 'vioBlink 1s step-end infinite' }} />
              </div>
            ) : entry.result ? (
              <>
                <div>
                  <span style={{ color: accent }}>{entry.prompt}</span>
                </div>
                {entry.result.stdout && (
                  <div style={{ whiteSpace: 'pre-wrap', color: textPrimary }}>{entry.result.stdout}</div>
                )}
                {entry.result.stderr && (
                  <div style={{ whiteSpace: 'pre-wrap', color: '#ff3333' }}>{entry.result.stderr}</div>
                )}
                {entry.result.exit_code !== 0 && (
                  <div style={{ color: '#ff3333', fontSize: 10 }}>exit code: {entry.result.exit_code}</div>
                )}
              </>
            ) : index === entries.length - 1 ? (
              <div>
                <span style={{ color: accent }}>{entry.prompt}</span>{' '}
                <form onSubmit={handleSubmit} style={{ display: 'inline' }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: textPrimary,
                      fontFamily: theme.font.mono,
                      fontSize: 12,
                      outline: 'none',
                      width: '60%',
                      caretColor: accent,
                    }}
                    autoFocus
                    spellCheck={false}
                  />
                </form>
              </div>
            ) : (
              <div>
                <span style={{ color: accent }}>{entry.prompt}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
