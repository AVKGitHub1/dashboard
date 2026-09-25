import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, X } from 'lucide-react';
import { CityResult, WeatherCurrent, weatherApi } from '../../../api/weather';
import { Widget } from '../../../api/widgets';
import { useDragReorder } from '../../../hooks/useDragReorder';
import CitySearch from './CitySearch';

export default function WeatherWidget({ widget }: { widget: Widget }) {
  const qc = useQueryClient();

  // The /weather/current route has no server-side cache (unlike RSS, which needs a
  // force flag to bypass one), so a plain refetch always hits OpenWeatherMap for fresh
  // readings — no extra query param needed for the refresh button.
  const { data = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['weather-current', widget.id],
    queryFn: () => weatherApi.current(widget.id),
    refetchInterval: 10 * 60 * 1000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['weather-current', widget.id] });

  const addCity = useMutation({
    mutationFn: (city: CityResult) => weatherApi.addCity(widget.id, city),
    onSuccess: invalidate,
  });
  const removeCity = useMutation({
    mutationFn: (id: number) => weatherApi.removeCity(id),
    onSuccess: invalidate,
  });

  const { getHandlers, isDragging } = useDragReorder(data, (next: WeatherCurrent[]) => {
    // Update the cache immediately so the reorder feels instant, then persist sort_order
    // server-side in the background (same pattern as the widget grid's own drag/resize).
    qc.setQueryData(['weather-current', widget.id], next);
    weatherApi.reorderCities(widget.id, next.map((d) => d.city.id));
  });

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <CitySearch onSelect={(city) => addCity.mutate(city)} />
        </div>
        <button
          className="-m-1 shrink-0 p-2 text-slate-400 hover:text-slate-100 disabled:opacity-50"
          title="Refresh now"
          aria-label="Refresh now"
          disabled={isFetching || data.length === 0}
          onClick={() => refetch()}
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {!isLoading && data.length === 0 && (
          <p className="text-sm text-slate-500">Add a city to see the weather.</p>
        )}
        {/* auto-fit + minmax means cards resize with the widget itself — drag the
            widget's corner wider/narrower and the cards reflow, no separate control needed. */}
        <div className="grid content-start gap-2 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
          {data.map(({ city, current, forecast, error }, index) => (
            <div
              key={city.id}
              {...getHandlers(index)}
              className={`group relative flex cursor-move flex-col items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center ${
                isDragging(index) ? 'opacity-40' : ''
              }`}
            >
              <button
                className="hover-reveal absolute right-0 top-0 p-2 text-slate-500 hover:text-red-400"
                aria-label={`Remove ${city.city_name}`}
                onClick={() => removeCity.mutate(city.id)}
              >
                <X size={13} />
              </button>
              <span className="w-full truncate text-sm font-medium text-slate-100">
                {city.city_name}
                {city.country ? `, ${city.country}` : ''}
              </span>
              {error && <p className="text-xs text-red-400">{error}</p>}
              {current && (
                <>
                  <span className="text-3xl font-semibold text-slate-50">{Math.round(current.temp)}°</span>
                  <span className="text-xs capitalize text-slate-400">{current.description}</span>
                </>
              )}
              {forecast.length > 0 && (
                <div className="mt-1 flex w-full justify-center gap-2 overflow-x-auto text-[11px] text-slate-500">
                  {forecast.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span>{new Date(f.dt * 1000).getHours()}:00</span>
                      <span>{Math.round(f.temp)}°</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
