import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CityResult, weatherApi } from '../../../api/weather';

function errorMessage(err: unknown): string {
  const anyErr = err as any;
  return anyErr?.response?.data?.error || 'Search failed. Check the OpenWeatherMap API key in Settings.';
}

export default function CitySearch({ onSelect }: { onSelect: (city: CityResult) => void }) {
  const [query, setQuery] = useState('');
  const { data: results = [], isError, error } = useQuery({
    queryKey: ['weather-search', query],
    queryFn: () => weatherApi.search(query),
    enabled: query.trim().length > 1,
    retry: false,
  });

  return (
    <div className="relative">
      <input
        className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
        placeholder="Add a city…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isError && <p className="mt-1 text-xs text-red-400">{errorMessage(error)}</p>}
      {!isError && query.trim().length > 1 && results.length === 0 && (
        <p className="mt-1 text-xs text-slate-500">No matches.</p>
      )}
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-700 bg-slate-800 shadow-lg">
          {results.map((city, i) => (
            <li key={i}>
              <button
                type="button"
                className="block w-full px-2 py-2 text-left text-sm text-slate-100 hover:bg-slate-700 sm:py-1"
                onClick={() => {
                  onSelect(city);
                  setQuery('');
                }}
              >
                {city.name}
                {city.state ? `, ${city.state}` : ''}
                {city.country ? `, ${city.country}` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
