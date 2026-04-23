import { useState, useCallback, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import { readFile, writeFile } from '../../api/tauri';
import { useThemeStore } from '../../core/theme-engine/themeStore';

import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-toml';

const LANG_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  rs: 'rust',
  py: 'python',
  json: 'json',
  css: 'css',
  md: 'markdown',
  sh: 'bash',
  bash: 'bash',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'toml',
  html: 'html',
};

function detectLang(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return LANG_MAP[ext] || 'text';
}

function getPrismLang(lang: string) {
  return (Prism.languages as Record<string, unknown>)[lang] || null;
}

export function CodeEditor() {
  const [code, setCode] = useState('// Welcome to VIO Code Editor\n// Press Ctrl/Cmd+O to open a file\n// Press Ctrl/Cmd+S to save\n\nfunction hello() {\n  console.log("Hello, VIO!");\n}\n');
  const [filePath, setFilePath] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready');
  const editorRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeStore();

  const accent = theme.colors.accent;
  const accentGlow = theme.colors.accentGlow;
  const textSecondary = theme.colors.textSecondary;
  const textTertiary = theme.colors.textTertiary;

  const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setIsDirty(true);
    setStatus('Modified');
  }, []);

  const handleOpen = useCallback(async () => {
    if (!isTauri) {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const text = await file.text();
        setCode(text);
        setFilePath(''); // Web file input doesn't expose full path; use download save
        setLanguage(detectLang(file.name));
        setIsDirty(false);
        setStatus('Loaded');
      };
      input.click();
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        // Use Tauri's readFile via a temporary path approach
        // Since web file input doesn't give full path, we read via FileReader
        const text = await file.text();
        setCode(text);
        setFilePath(file.name);
        setLanguage(detectLang(file.name));
        setIsDirty(false);
        setError(null);
        setStatus('Loaded');
      } catch (e) {
        setError(String(e));
      }
    };
    input.click();
  }, [isTauri]);

  const handleSave = useCallback(async () => {
    if (!isTauri) {
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath || 'untitled.txt';
      a.click();
      URL.revokeObjectURL(url);
      setIsDirty(false);
      setStatus('Saved');
      return;
    }

    if (!filePath) {
      // Prompt for save path via download fallback
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'untitled.txt';
      a.click();
      URL.revokeObjectURL(url);
      setIsDirty(false);
      setStatus('Saved');
      return;
    }

    try {
      await writeFile(filePath, code);
      setIsDirty(false);
      setError(null);
      setStatus('Saved');
    } catch (e) {
      setError(String(e));
      setStatus('Error');
    }
  }, [code, filePath, isTauri]);

  const handleNew = useCallback(() => {
    setCode('');
    setFilePath('');
    setLanguage('text');
    setIsDirty(false);
    setStatus('New file');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (isMod && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleSave, handleOpen]);

  const highlightCode = useCallback(
    (code: string) => {
      const grammar = getPrismLang(language);
      if (!grammar) return code;
      return Prism.highlight(code, grammar as Prism.Grammar, language);
    },
    [language]
  );

  const lineCount = code.split('\n').length;
  const charCount = code.length;
  const fileName = filePath.split('/').pop() || 'untitled';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          background: 'rgba(0,0,0,0.2)',
          borderBottom: `1px solid ${theme.colors.accentGlow06}`,
          fontSize: 11,
        }}
      >
        <button
          onClick={handleNew}
          style={{
            padding: '2px 8px',
            borderRadius: 3,
            border: `1px solid ${accentGlow}`,
            background: 'transparent',
            color: textSecondary,
            cursor: 'default',
            fontSize: 10,
            fontFamily: theme.font.ui,
          }}
        >
          New
        </button>
        <button
          onClick={handleOpen}
          style={{
            padding: '2px 8px',
            borderRadius: 3,
            border: `1px solid ${accentGlow}`,
            background: 'transparent',
            color: textSecondary,
            cursor: 'default',
            fontSize: 10,
            fontFamily: theme.font.ui,
          }}
        >
          Open
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '2px 8px',
            borderRadius: 3,
            border: `1px solid ${isDirty ? theme.colors.accentGlow30 : accentGlow}`,
            background: isDirty ? accentGlow : 'transparent',
            color: isDirty ? accent : textSecondary,
            cursor: 'default',
            fontSize: 10,
            fontFamily: theme.font.ui,
          }}
        >
          {isDirty ? 'Save*' : 'Save'}
        </button>

        <div style={{ width: 1, height: 16, background: theme.colors.accentGlow10 }} />

        <span style={{ color: textTertiary, fontSize: 10, fontFamily: theme.font.mono }}>
          {fileName}
        </span>

        {isDirty && <span style={{ color: accent, fontSize: 10 }}>●</span>}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${theme.colors.accentGlow10}`,
              borderRadius: 3,
              color: textSecondary,
              fontSize: 10,
              fontFamily: theme.font.mono,
              padding: '2px 6px',
              outline: 'none',
            }}
          >
            {['text', 'javascript', 'typescript', 'jsx', 'tsx', 'rust', 'python', 'json', 'css', 'markdown', 'bash', 'yaml', 'toml', 'html'].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <span style={{ color: textTertiary, fontSize: 9, fontFamily: theme.font.mono }}>
            {lineCount}L / {charCount}C
          </span>
          <span
            style={{
              fontSize: 9,
              color: status === 'Saved' ? '#00ff41' : status === 'Error' ? '#ff3333' : status === 'Modified' ? accent : textTertiary,
              fontFamily: theme.font.mono,
            }}
          >
            {status}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ padding: '4px 10px', fontSize: 10, color: '#ff3333', background: 'rgba(255,51,51,0.05)' }}>
          {error}
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        style={{
          flex: 1,
          overflow: 'auto',
          background: 'rgba(0,0,0,0.25)',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <Editor
          value={code}
          onValueChange={handleCodeChange}
          highlight={highlightCode}
          padding={12}
          textareaClassName="vio-code-textarea"
          style={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 12,
            lineHeight: '1.6em',
            background: 'transparent',
            color: theme.colors.textPrimary,
            minHeight: '100%',
          }}
        />
      </div>

      {/* Prism dark theme override */}
      <style>{`
        .vio-code-textarea {
          outline: none !important;
          border: none !important;
          background: transparent !important;
          color: ${theme.colors.textPrimary} !important;
          caret-color: ${accent} !important;
        }
        .vio-code-textarea::selection {
          background: ${theme.colors.accentGlow25} !important;
        }
        code[class*="language-"],
        pre[class*="language-"] {
          color: ${theme.colors.textPrimary};
          background: none;
          font-family: "JetBrains Mono", "Fira Code", monospace;
          font-size: 12px;
          text-align: left;
          white-space: pre;
          word-spacing: normal;
          word-break: normal;
          word-wrap: normal;
          line-height: 1.6;
          tab-size: 2;
          hyphens: none;
        }
        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
          color: #606060;
        }
        .token.punctuation {
          color: #888;
        }
        .token.property,
        .token.tag,
        .token.boolean,
        .token.number,
        .token.constant,
        .token.symbol,
        .token.deleted {
          color: #ff6b6b;
        }
        .token.selector,
        .token.attr-name,
        .token.string,
        .token.char,
        .token.builtin,
        .token.inserted {
          color: #7ee787;
        }
        .token.operator,
        .token.entity,
        .token.url,
        .language-css .token.string,
        .style .token.string {
          color: #79c0ff;
        }
        .token.atrule,
        .token.attr-value,
        .token.keyword {
          color: #ff7b72;
        }
        .token.function,
        .token.class-name {
          color: #d2a8ff;
        }
        .token.regex,
        .token.important,
        .token.variable {
          color: #ffa657;
        }
      `}</style>
    </div>
  );
}
