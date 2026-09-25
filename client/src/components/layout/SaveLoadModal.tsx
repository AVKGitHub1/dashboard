import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { savesApi } from '../../api/saves';
import { parseSqliteUtc } from '../../lib/dates';

export default function SaveLoadModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const qc = useQueryClient();

  const { data: saves = [], isLoading } = useQuery({ queryKey: ['saves'], queryFn: savesApi.list });

  const createSave = useMutation({
    mutationFn: (n: string) => savesApi.create(n),
    onSuccess: () => {
      setName('');
      qc.invalidateQueries({ queryKey: ['saves'] });
    },
  });

  const loadSave = useMutation({
    mutationFn: (id: number) => savesApi.load(id),
    onSuccess: () => {
      // Loading replaces every widget with new ids, which would leave dozens of
      // widget-scoped query caches (weather-current, stock-watchlist, etc.) pointing
      // at ids that no longer exist. A full reload is the simplest correct fix.
      window.location.reload();
    },
  });

  const deleteSave = useMutation({
    mutationFn: (id: number) => savesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saves'] }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[85dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-slate-100">Dashboard layouts</h2>
          <button className="-m-2 p-2 text-slate-500 hover:text-slate-200" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createSave.mutate(name.trim());
          }}
        >
          <input
            className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none sm:py-1"
            placeholder="Name this layout…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            disabled={!name.trim() || createSave.isPending}
            className="flex items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50 sm:py-1"
          >
            <Save size={14} /> Save current
          </button>
        </form>

        <div className="max-h-64 space-y-1 overflow-auto">
          {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
          {!isLoading && saves.length === 0 && (
            <p className="text-sm text-slate-500">No saved layouts yet.</p>
          )}
          {saves.map((save) => (
            <div
              key={save.id}
              className="flex items-center justify-between gap-2 rounded-md border border-slate-800 px-2 py-1.5"
            >
              <div className="overflow-hidden">
                <div className="truncate text-sm text-slate-100">{save.name}</div>
                <div className="text-xs text-slate-500">{parseSqliteUtc(save.created_at).toLocaleString()}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  className="flex items-center gap-1 rounded-md border border-slate-700 px-2 py-2 text-xs text-slate-200 hover:border-blue-500 hover:text-blue-400 sm:py-1"
                  onClick={() => {
                    if (window.confirm(`Load "${save.name}"? This replaces your current dashboard.`)) {
                      loadSave.mutate(save.id);
                    }
                  }}
                >
                  <FolderOpen size={12} /> Load
                </button>
                <button
                  className="-m-1 p-2 text-slate-500 hover:text-red-400"
                  aria-label={`Delete ${save.name}`}
                  onClick={() => deleteSave.mutate(save.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
