import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/client';

interface Status {
  openweathermap: boolean;
  finnhub: boolean;
}

const PROVIDERS: { key: keyof Status; label: string; helpUrl: string }[] = [
  { key: 'openweathermap', label: 'OpenWeatherMap', helpUrl: 'https://openweathermap.org/api' },
  { key: 'finnhub', label: 'Finnhub', helpUrl: 'https://finnhub.io/register' },
];

export default function ApiKeyForm() {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ['api-key-status'],
    queryFn: () => api.get<Status>('/settings/api-keys').then((r) => r.data),
  });

  const save = useMutation({
    mutationFn: ({ provider, apiKey }: { provider: string; apiKey: string }) =>
      api.put(`/settings/api-keys/${provider}`, { apiKey }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-key-status'] }),
  });

  const remove = useMutation({
    mutationFn: (provider: string) => api.delete(`/settings/api-keys/${provider}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-key-status'] }),
  });

  return (
    <div className="space-y-4">
      {PROVIDERS.map((p) => {
        const configured = data?.[p.key];
        return (
          <div key={p.key} className="rounded-lg border border-slate-800 p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-100">{p.label}</span>
              <span className={configured ? 'text-xs text-emerald-400' : 'text-xs text-slate-500'}>
                {configured ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Get a free API key at{' '}
              <a href={p.helpUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                {p.helpUrl}
              </a>
            </p>
            <div className="mt-2 flex gap-2">
              <input
                type="password"
                className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100"
                placeholder="Enter API key"
                value={drafts[p.key] || ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [p.key]: e.target.value }))}
              />
              <button
                className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
                onClick={() => drafts[p.key] && save.mutate({ provider: p.key, apiKey: drafts[p.key] })}
              >
                Save
              </button>
              {configured && (
                <button
                  className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-red-500 hover:text-red-400"
                  onClick={() => remove.mutate(p.key)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
