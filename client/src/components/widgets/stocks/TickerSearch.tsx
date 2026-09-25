import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { stocksApi, TickerSearchResult } from '../../../api/stocks';

export default function TickerSearch({ onSelect }: { onSelect: (result: TickerSearchResult) => void }) {
  const [query, setQuery] = useState('');
  const { data: results = [] } = useQuery({
    queryKey: ['stock-search', query],
    queryFn: () => stocksApi.search(query),
    enabled: query.trim().length > 0,
  });

  return (
    <div className="relative">
      <input
        className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Search ticker (e.g. AAPL)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-700 bg-slate-800 shadow-lg">
          {results.map((r) => (
            <li key={r.symbol}>
              <button
                type="button"
                className="flex w-full justify-between gap-2 px-2 py-2 text-left text-sm text-slate-100 hover:bg-slate-700 sm:py-1"
                onClick={() => {
                  onSelect(r);
                  setQuery('');
                }}
              >
                <span className="shrink-0 font-medium">{r.symbol}</span>
                <span className="truncate text-slate-400">{r.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
