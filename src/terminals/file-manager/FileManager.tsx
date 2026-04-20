import { useState, useEffect, useCallback } from 'react';
import { listDirectory, readFile, getHomeDirectory, type FileEntry, type DirectoryListing } from '../../api/tauri';
import { useThemeStore } from '../../core/theme-engine/themeStore';

export function FileManager() {
  const [currentPath, setCurrentPath] = useState('/');
  const [listing, setListing] = useState<DirectoryListing | null>(null);
  const [preview, setPreview] = useState<{ path: string; content: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useThemeStore();

  const accent = theme.colors.accent;
  const textSecondary = theme.colors.textSecondary;
  const textTertiary = theme.colors.textTertiary;
  const accentGlow = theme.colors.accentGlow;

  const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

  const loadDir = useCallback(async (path: string) => {
    if (!isTauri) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listDirectory(path);
      setListing(result);
      setCurrentPath(result.path);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [isTauri]);

  useEffect(() => {
    if (isTauri) {
      getHomeDirectory().then((home) => loadDir(home)).catch(() => loadDir('/'));
    }
  }, [isTauri, loadDir]);

  const handleEntryClick = async (entry: FileEntry) => {
    if (entry.is_dir) {
      loadDir(entry.path);
    } else if (entry.is_file) {
      try {
        const content = await readFile(entry.path);
        setPreview({ path: content.path, content: content.content });
      } catch (e) {
        setPreview({ path: entry.path, content: `Error reading file: ${e}` });
      }
    }
  };

  const navigateUp = () => {
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadDir(parent);
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isTauri) {
    return (
      <div style={{ padding: 20, color: textSecondary, fontSize: 12 }}>
        <div style={{ color: '#ffb000', marginBottom: 16, padding: '8px 12px', border: '1px solid rgba(255,176,0,0.2)', borderRadius: 3, background: 'rgba(255,176,0,0.05)' }}>
          ⚠ Browser mode — file system access unavailable. Use `npm run tauri:dev` for real file manager.
        </div>
        <div>File Manager requires Tauri desktop runtime.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 12, height: '100%', fontSize: 11 }}>
      {/* File list */}
      <div style={{ width: '55%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <button
            onClick={navigateUp}
            style={{ padding: '2px 8px', background: accentGlow, border: `1px solid ${accentGlow.replace('0.15', '0.2')}`, borderRadius: 3, color: accent, cursor: 'default', fontSize: 11 }}
          >
            ↑ Up
          </button>
          <div style={{ flex: 1, padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 3, color: textTertiary, fontSize: 10, fontFamily: theme.font.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentPath}
          </div>
        </div>

        {error && <div style={{ color: '#ff3333', fontSize: 10, marginBottom: 8 }}>{error}</div>}

        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ color: textTertiary, textAlign: 'center', padding: 20 }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  {['Name', 'Size', 'Modified'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: 1, color: textTertiary, fontSize: 9, fontFamily: theme.font.ui }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listing?.entries.map((entry) => (
                  <tr
                    key={entry.path}
                    style={{ transition: 'background 0.15s', cursor: 'default' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = accentGlow.replace('0.15', '0.03'))}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => handleEntryClick(entry)}
                  >
                    <td style={{ padding: '4px 8px', color: entry.is_dir ? accent : textSecondary }}>
                      {entry.is_dir ? '📁' : '📄'} {entry.name}
                    </td>
                    <td style={{ padding: '4px 8px', color: textTertiary, fontSize: 10 }}>
                      {formatSize(entry.size)}
                    </td>
                    <td style={{ padding: '4px 8px', color: textTertiary, fontSize: 10 }}>
                      {entry.modified ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Preview */}
      <div style={{ flex: 1, borderLeft: `1px solid ${accentGlow.replace('0.15', '0.06')}`, paddingLeft: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, color: textTertiary, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Preview</div>
        {preview ? (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ fontSize: 9, color: textTertiary, marginBottom: 8, fontFamily: theme.font.mono }}>{preview.path}</div>
            <pre style={{ fontSize: 11, lineHeight: 1.6, color: textSecondary, fontFamily: theme.font.mono, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
              {preview.content.slice(0, 5000)}
              {preview.content.length > 5000 && '\n\n... [truncated]'}
            </pre>
          </div>
        ) : (
          <div style={{ color: textTertiary, fontSize: 12, padding: 20, textAlign: 'center' }}>
            Select a file to preview
          </div>
        )}
      </div>
    </div>
  );
}
