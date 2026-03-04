'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin.service';
import type { ConfigEntry, ConfigListResponse } from '@/types/admin';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

interface EditModalProps {
  entry: ConfigEntry;
  onSave: (key: string, value: string, description: string) => Promise<void>;
  onClose: () => void;
}

function EditModal({ entry, onSave, onClose }: EditModalProps) {
  const [valueStr, setValueStr] = useState(formatValue(entry.value));
  const [description, setDescription] = useState(entry.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(entry.key, valueStr, description);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-white font-semibold mb-4">
          Edit Config: <span className="text-indigo-300 font-mono text-sm">{entry.key}</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">Value (JSON or string)</label>
            <textarea
              value={valueStr}
              onChange={(event) => setValueStr(event.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {error ? <p className="text-red-400 text-xs mt-3">{error}</p> : null}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminConfigPageView() {
  const [data, setData] = useState<ConfigListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<ConfigEntry | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch<ConfigListResponse>('/config');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleSave = async (key: string, valueStr: string, description: string) => {
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(valueStr);
    } catch {
      parsedValue = valueStr;
    }

    await adminFetch('/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: parsedValue, description: description || null }),
    });

    await fetchConfig();
  };

  return (
    <div className="space-y-6">
      {editEntry ? <EditModal entry={editEntry} onSave={handleSave} onClose={() => setEditEntry(null)} /> : null}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">System Configuration</h1>
          <p className="text-white/40 text-sm mt-0.5">{data ? `${data.total} config entries` : 'Loading...'}</p>
        </div>
        <button
          onClick={() => void fetchConfig()}
          className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => void fetchConfig()} className="text-red-300 hover:text-red-200 underline text-xs ml-4">
            Retry
          </button>
        </div>
      ) : null}

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Key', 'Value', 'Description', 'Last Updated', ''].map((header) => (
                  <th key={header} className="px-4 py-2.5 text-left text-white/40 text-xs uppercase tracking-wider font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, row) => (
                  <tr key={row} className="border-b border-white/5">
                    {Array.from({ length: 5 }).map((_, col) => (
                      <td key={col} className="px-4 py-3">
                        <div className="h-3 bg-white/10 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (data?.configs.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">
                    No configuration entries found
                  </td>
                </tr>
              ) : (
                data?.configs.map((config) => (
                  <tr key={config.key} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-mono text-xs">{config.key}</td>
                    <td className="px-4 py-3 text-white/60 font-mono text-xs max-w-xs truncate">{formatValue(config.value)}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{config.description ?? '—'}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{formatDate(config.updated_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditEntry(config)}
                        className="px-2.5 py-1 rounded-md text-xs bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
