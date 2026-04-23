import { useState, useRef, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { usePluginStore, type PluginContext } from '../../core/plugin-system';
import type { ShellResult } from '../../api/tauri';

interface OpenCLITerminalProps {
  context?: PluginContext;
  isFocused?: boolean;
}

interface CommandEntry {
  id: number;
  prompt: string;
  result: ShellResult | null;
  isLoading: boolean;
  /** Structured output for pipeline transmission */
  structuredOutput?: unknown;
}

interface OpenCLISettings {
  opencliPath: string;
  defaultFormat: 'table' | 'json' | 'yaml' | 'csv' | 'md';
  autoPipeline: boolean;
}

export function OpenCLITerminal({ context, isFocused }: OpenCLITerminalProps) {
  const [entries, setEntries] = useState<CommandEntry[]>([
    { id: 0, prompt: 'opencli> ', result: null, isLoading: false },
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

  const pipeline = context?.pipeline;

  const settings: OpenCLISettings = {
    opencliPath: (context?.config.settings.opencliPath as string) || 'opencli',
    defaultFormat: (context?.config.settings.defaultFormat as OpenCLISettings['defaultFormat']) || 'table',
    autoPipeline: (context?.config.settings.autoPipeline as boolean) ?? false,
  };

  const accent = theme.colors.accent;
  const textPrimary = theme.colors.textPrimary;
  const textSecondary = theme.colors.textSecondary;
  const textTertiary = theme.colors.textTertiary;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  // Subscribe to pipeline data
  useEffect(() => {
    if (!pipeline) return;
    
    const unsubscribe = pipeline.subscribe((packet) => {
      if (packet.type === 'text' || packet.type === 'json') {
        const dataStr = typeof packet.data === 'string' 
          ? packet.data 
          : JSON.stringify(packet.data, null, 2);
        
        setEntries((prev) => [
          ...prev,
          {
            id: nextId.current++,
            prompt: `[pipeline:${packet.sourceId.slice(0, 8)}]> `,
            result: { stdout: dataStr, stderr: '', exit_code: 0 },
            isLoading: false,
            structuredOutput: packet.data,
          },
          { id: nextId.current++, prompt: 'opencli> ', result: null, isLoading: false },
        ]);
      }
    });

    return unsubscribe;
  }, [pipeline]);

  const MAX_ENTRIES = 500;
  const MAX_HISTORY = 200;

  const execute = useCallback(async (command: string) => {
    const id = nextId.current++;

    setEntries((prev) => [
      ...prev.slice(-MAX_ENTRIES + 2),
      { id, prompt: `opencli> ${command}`, result: null, isLoading: true },
    ]);

    try {
      // Check if we need to inject format flag for structured output
      let finalCommand = command;
      const isStructuredCommand = 
        !command.includes('-f ') && 
        !command.includes('--format ') &&
        !command.startsWith('list') &&
        !command.startsWith('doctor');
      
      if (isStructuredCommand && settings.defaultFormat !== 'table') {
        finalCommand = `${command} -f ${settings.defaultFormat}`;
      }

      const result = await invoke<ShellResult>('execute_command', {
        cmd: settings.opencliPath,
        args: finalCommand.split(' ').filter(Boolean),
      });

      // Try to parse structured output for pipeline
      let structuredOutput: unknown = undefined;
      if (settings.defaultFormat === 'json' && result.stdout) {
        try {
          structuredOutput = JSON.parse(result.stdout);
        } catch {
          // Not valid JSON, ignore
        }
      }

      // Auto-send to pipeline if enabled and connected
      if (settings.autoPipeline && pipeline?.isConnected() && structuredOutput) {
        pipeline.write({
          sourceId: context?.windowId || 'opencli',
          type: 'json',
          data: structuredOutput,
          meta: { command, format: settings.defaultFormat },
        });
      }

      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, result, isLoading: false, structuredOutput }
            : e
        )
      );
    } catch (e) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                result: {
                  stdout: '',
                  stderr: String(e),
                  exit_code: -1,
                },
                isLoading: false,
              }
            : e
        )
      );
    }

    setEntries((prev) => [
      ...prev.slice(-MAX_ENTRIES + 1),
      { id: nextId.current++, prompt: 'opencli> ', result: null, isLoading: false },
    ]);
  }, [settings, pipeline, context?.windowId]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const cmd = input.trim();
      if (!cmd) return;

      // Handle special pipeline commands
      if (cmd.startsWith('@')) {
        const pipelineCmd = cmd.slice(1).trim();
        
        if (pipelineCmd.startsWith('connect ')) {
          const targetId = pipelineCmd.slice(8).trim();
          if (context?.windowId && targetId) {
            usePluginStore.getState().connectPipeline(context.windowId, targetId);
            setEntries((prev) => [
              ...prev,
              { id: nextId.current++, prompt: `[pipeline] Connected to ${targetId}`, result: null, isLoading: false },
              { id: nextId.current++, prompt: 'opencli> ', result: null, isLoading: false },
            ]);
          }
          setInput('');
          return;
        }
        
        if (pipelineCmd === 'disconnect') {
          if (context?.windowId) {
            usePluginStore.getState().disconnectPipeline(context.windowId);
            setEntries((prev) => [
              ...prev,
              { id: nextId.current++, prompt: '[pipeline] Disconnected', result: null, isLoading: false },
              { id: nextId.current++, prompt: 'opencli> ', result: null, isLoading: false },
            ]);
          }
          setInput('');
          return;
        }
        
        if (pipelineCmd === 'status') {
          const connected = pipeline?.isConnected() ?? false;
          const targetId = pipeline?.getTargetId();
          setEntries((prev) => [
            ...prev,
            { 
              id: nextId.current++, 
              prompt: `[pipeline] Status: ${connected ? `connected to ${targetId}` : 'disconnected'}`, 
              result: null, 
              isLoading: false 
            },
            { id: nextId.current++, prompt: 'opencli> ', result: null, isLoading: false },
          ]);
          setInput('');
          return;
        }

        if (pipelineCmd.startsWith('send ')) {
          const dataStr = pipelineCmd.slice(5).trim();
          try {
            const data = JSON.parse(dataStr);
            pipeline?.write({
              sourceId: context?.windowId || 'opencli',
              type: 'json',
              data,
            });
            setEntries((prev) => [
              ...prev,
              { id: nextId.current++, prompt: '[pipeline] Data sent', result: null, isLoading: false },
              { id: nextId.current++, prompt: 'opencli> ', result: null, isLoading: false },
            ]);
          } catch {
            pipeline?.write({
              sourceId: context?.windowId || 'opencli',
              type: 'text',
              data: dataStr,
            });
            setEntries((prev) => [
              ...prev,
              { id: nextId.current++, prompt: '[pipeline] Text sent', result: null, isLoading: false },
              { id: nextId.current++, prompt: 'opencli> ', result: null, isLoading: false },
            ]);
          }
          setInput('');
          return;
        }
      }

      setHistory((prev) => [...prev, cmd].slice(-MAX_HISTORY));
      setHistoryIndex(-1);
      setInput('');
      execute(cmd);
    },
    [input, execute, pipeline, context?.windowId]
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
    <div
      style={{
        fontFamily: theme.font.mono,
        fontSize: 12,
        lineHeight: 1.6,
        color: textTertiary,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          borderBottom: `1px solid ${theme.colors.accentDim10}`,
          fontSize: 10,
          color: textTertiary,
        }}
      >
        <span>OpenCLI Terminal</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {pipeline?.isConnected() && (
            <span style={{ color: accent }}>
              ● pipeline → {pipeline.getTargetId()?.slice(0, 8)}
            </span>
          )}
          <span>format: {settings.defaultFormat}</span>
        </span>
      </div>

      {!isTauri && (
        <div
          style={{
            fontSize: 10,
            color: '#ffb000',
            margin: 8,
            padding: '4px 8px',
            border: '1px solid rgba(255,176,0,0.2)',
            borderRadius: 3,
            background: 'rgba(255,176,0,0.05)',
          }}
        >
          ⚠ Browser mode — commands will fail. Use `npm run tauri:dev` for real
          shell.
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {entries.map((entry, index) => (
          <div key={entry.id} style={{ marginBottom: 4 }}>
            {entry.isLoading ? (
              <div>
                <span style={{ color: accent }}>{entry.prompt}</span>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 15,
                    background: accent,
                    verticalAlign: 'middle',
                    marginLeft: 4,
                    animation: 'vioBlink 1s step-end infinite',
                  }}
                />
              </div>
            ) : entry.result ? (
              <>
                <div>
                  <span style={{ color: accent }}>{entry.prompt}</span>
                </div>
                {entry.result.stdout && (
                  <div style={{ whiteSpace: 'pre-wrap', color: textPrimary }}>
                    {entry.result.stdout}
                  </div>
                )}
                {entry.result.stderr && (
                  <div style={{ whiteSpace: 'pre-wrap', color: '#ff3333' }}>
                    {entry.result.stderr}
                  </div>
                )}
                {entry.result.exit_code !== 0 && (
                  <div style={{ color: '#ff3333', fontSize: 10 }}>
                    exit code: {entry.result.exit_code}
                  </div>
                )}
                {/* Pipeline action button */}
                {entry.structuredOutput && pipeline?.isConnected() && (
                  <button
                    onClick={() =>
                      pipeline.write({
                        sourceId: context?.windowId || 'opencli',
                        type: 'json',
                        data: entry.structuredOutput,
                      })
                    }
                    style={{
                      marginTop: 4,
                      padding: '2px 8px',
                      fontSize: 10,
                      background: 'transparent',
                      border: `1px solid ${accent}`,
                      color: accent,
                      cursor: 'pointer',
                      borderRadius: 2,
                    }}
                  >
                    ↗ Send to Pipeline
                  </button>
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
                    placeholder="type 'list' to see commands, '@connect <id>' for pipeline"
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

      {/* Help hint */}
      <div
        style={{
          padding: '4px 8px',
          borderTop: `1px solid ${theme.colors.accentDim10}`,
          fontSize: 9,
          color: textTertiary,
          display: 'flex',
          gap: 12,
        }}
      >
        <span>{'@connect <id> — connect pipeline'}</span>
        <span>@disconnect — disconnect</span>
        <span>{'@send <data> — send data'}</span>
        <span>@status — pipeline status</span>
      </div>
    </div>
  );
}
