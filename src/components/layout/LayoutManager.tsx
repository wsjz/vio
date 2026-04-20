import { useState, useEffect, useCallback } from 'react';
import { useThemeStore } from '../../core/theme-engine/themeStore';
import { useWindowStore } from '../../core/window-manager/windowStore';
import {
  saveLayout,
  loadLayout,
  listLayouts,
  deleteLayout,
  exportLayout,
  importLayout,
  type LayoutSummary,
  type LayoutData,
} from '../../api/tauri';
import type { TerminalType } from '../../types';

export function LayoutManager() {
  const { theme } = useThemeStore();
  const { windows, createWindow, clearWindows } = useWindowStore();
  const [layouts, setLayouts] = useState<LayoutSummary[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listLayouts();
      setLayouts(list);
    } catch {
      setLayouts([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const layoutWindows = windows.map((w) => ({
        window_type: w.type,
        position: { x: w.position.x, y: w.position.y },
        size: { width: w.size.width, height: w.size.height },
      }));
      await saveLayout(name.trim(), description.trim(), layoutWindows);
      showMsg(`Layout "${name.trim()}" saved`);
      setName('');
      setDescription('');
      refresh();
    } catch (e) {
      showMsg(`Save failed: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (layoutName: string) => {
    setLoading(true);
    try {
      const data: LayoutData = await loadLayout(layoutName);
      clearWindows();
      // Delay slightly to let clearWindows render
      setTimeout(() => {
        data.windows.forEach((w) => {
          createWindow(w.window_type as TerminalType, {}, {
            position: { x: w.position.x, y: w.position.y },
            size: { width: w.size.width, height: w.size.height },
          });
        });
        showMsg(`Layout "${layoutName}" loaded`);
      }, 50);
    } catch (e) {
      showMsg(`Load failed: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (layoutName: string) => {
    if (!confirm(`Delete layout "${layoutName}"?`)) return;
    try {
      await deleteLayout(layoutName);
      refresh();
      showMsg(`Layout "${layoutName}" deleted`);
    } catch (e) {
      showMsg(`Delete failed: ${e}`);
    }
  };

  const handleExport = async (layoutName: string) => {
    try {
      // Use a default export path in home dir
      const home = await import('../../api/tauri').then((m) => m.getHomeDirectory());
      const filePath = `${home}/${layoutName}.vio-layout.json`;
      await exportLayout(layoutName, filePath);
      showMsg(`Exported to ${filePath}`);
    } catch (e) {
      showMsg(`Export failed: ${e}`);
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // Write to temp then import via backend
          const text = String(reader.result);
          const data = JSON.parse(text);
          const home = await import('../../api/tauri').then((m) => m.getHomeDirectory());
          const tempPath = `${home}/.vio/imported-${Date.now()}.json`;
          await import('../../api/tauri').then((m) => m.writeFile(tempPath, text));
          const summary = await importLayout(tempPath);
          refresh();
          showMsg(`Imported "${summary.name}"`);
        } catch (e) {
          showMsg(`Import failed: ${e}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
      {/* Save new layout */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: theme.colors.textSecondary, marginBottom: 6 }}>Save Current Layout</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Layout name"
            style={{
              flex: 1,
              padding: '4px 8px',
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${theme.colors.borderDefault}`,
              borderRadius: 3,
              color: theme.colors.textSecondary,
              fontSize: 11,
              fontFamily: theme.font.mono,
              outline: 'none',
            }}
          />
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            style={{
              padding: '4px 12px',
              background: theme.colors.accentDim,
              border: `1px solid ${theme.colors.accent}`,
              borderRadius: 3,
              color: theme.colors.accent,
              fontSize: 11,
              fontFamily: theme.font.mono,
              cursor: 'pointer',
              opacity: loading || !name.trim() ? 0.5 : 1,
            }}
          >
            {loading ? '...' : 'Save'}
          </button>
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          style={{
            width: '100%',
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${theme.colors.borderDefault}`,
            borderRadius: 3,
            color: theme.colors.textSecondary,
            fontSize: 11,
            fontFamily: theme.font.mono,
            outline: 'none',
          }}
        />
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            padding: '4px 8px',
            marginBottom: 8,
            borderRadius: 3,
            background: 'rgba(0,240,255,0.08)',
            border: '1px solid rgba(0,240,255,0.15)',
            color: theme.colors.accent,
            fontSize: 10,
            fontFamily: theme.font.mono,
          }}
        >
          {message}
        </div>
      )}

      {/* Import button */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={handleImport}
          style={{
            padding: '4px 12px',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${theme.colors.borderDefault}`,
            borderRadius: 3,
            color: theme.colors.textSecondary,
            fontSize: 11,
            fontFamily: theme.font.mono,
            cursor: 'pointer',
          }}
        >
          📥 Import Layout File
        </button>
      </div>

      {/* Layout list */}
      <div>
        <div style={{ color: theme.colors.textTertiary, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
          Saved Layouts ({layouts.length})
        </div>
        {layouts.length === 0 ? (
          <div style={{ color: theme.colors.textTertiary, fontSize: 11 }}>No saved layouts</div>
        ) : (
          layouts.map((layout) => (
            <div
              key={layout.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                marginBottom: 4,
                borderRadius: 3,
                background: 'rgba(0,0,0,0.15)',
                border: `1px solid ${theme.colors.borderDefault}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: 600 }}>{layout.name}</div>
                <div style={{ fontSize: 9, color: theme.colors.textTertiary, marginTop: 2 }}>
                  {layout.window_count} windows · {layout.description || 'No description'}
                </div>
              </div>
              <button
                onClick={() => handleLoad(layout.name)}
                title="Load"
                style={{
                  padding: '2px 8px',
                  background: 'rgba(0,255,65,0.08)',
                  border: '1px solid rgba(0,255,65,0.2)',
                  borderRadius: 3,
                  color: '#00ff41',
                  fontSize: 10,
                  fontFamily: theme.font.mono,
                  cursor: 'pointer',
                }}
              >
                Load
              </button>
              <button
                onClick={() => handleExport(layout.name)}
                title="Export"
                style={{
                  padding: '2px 8px',
                  background: 'rgba(0,240,255,0.08)',
                  border: '1px solid rgba(0,240,255,0.2)',
                  borderRadius: 3,
                  color: theme.colors.accent,
                  fontSize: 10,
                  fontFamily: theme.font.mono,
                  cursor: 'pointer',
                }}
              >
                Export
              </button>
              <button
                onClick={() => handleDelete(layout.name)}
                title="Delete"
                style={{
                  padding: '2px 8px',
                  background: 'rgba(255,51,51,0.08)',
                  border: '1px solid rgba(255,51,51,0.2)',
                  borderRadius: 3,
                  color: '#ff3333',
                  fontSize: 10,
                  fontFamily: theme.font.mono,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
