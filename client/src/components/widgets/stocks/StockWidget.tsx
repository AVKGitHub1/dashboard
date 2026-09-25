import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { stocksApi, TickerSearchResult, TimeRange, WatchlistItem } from '../../../api/stocks';
import { Widget } from '../../../api/widgets';
import { useDragReorder } from '../../../hooks/useDragReorder';
import { useUpdateWidgetConfig } from '../../../hooks/useWidgets';
import TickerRow from './TickerRow';
import TickerSearch from './TickerSearch';
import TimeRangeSelector from './TimeRangeSelector';

export default function StockWidget({ widget }: { widget: Widget }) {
  const qc = useQueryClient();
  const updateConfig = useUpdateWidgetConfig();
  const range: TimeRange = widget.config.timeRange || '1D';

  const { data: watchlist = [] } = useQuery({
    queryKey: ['stock-watchlist', widget.id],
    queryFn: () => stocksApi.listWatchlist(widget.id),
  });

  const symbols = watchlist.map((w) => w.symbol);
  const { data: quotes = [] } = useQuery({
    queryKey: ['stock-quotes', symbols],
    queryFn: () => stocksApi.quotes(symbols),
    enabled: symbols.length > 0,
    refetchInterval: 30 * 1000,
  });

  const invalidateWatchlist = () => qc.invalidateQueries({ queryKey: ['stock-watchlist', widget.id] });

  const addTicker = useMutation({
    mutationFn: (result: TickerSearchResult) => stocksApi.addTicker(widget.id, result.symbol, result.description),
    onSuccess: invalidateWatchlist,
  });
  const removeTicker = useMutation({
    mutationFn: (id: number) => stocksApi.removeTicker(id),
    onSuccess: invalidateWatchlist,
  });

  const setRange = (newRange: TimeRange) =>
    updateConfig.mutate({ id: widget.id, config: { ...widget.config, timeRange: newRange } });

  const { getHandlers, isDragging } = useDragReorder(watchlist, (next: WatchlistItem[]) => {
    qc.setQueryData(['stock-watchlist', widget.id], next);
    stocksApi.reorderWatchlist(widget.id, next.map((w) => w.id));
  });

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        {/* min-w-0 lets the search box absorb the width the range buttons need, instead
            of the two of them overflowing a narrow (or full-width phone) widget. */}
        <div className="min-w-0 flex-1">
          <TickerSearch onSelect={(r) => addTicker.mutate(r)} />
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>
      <div className="flex-1 space-y-1.5 overflow-auto">
        {watchlist.length === 0 && <p className="text-sm text-slate-500">Search and add a ticker.</p>}
        {watchlist.map((item, index) => (
          <TickerRow
            key={item.id}
            item={item}
            quote={quotes.find((q) => q.symbol === item.symbol)}
            range={range}
            onRemove={(id) => removeTicker.mutate(id)}
            dragHandlers={getHandlers(index)}
            isDragging={isDragging(index)}
          />
        ))}
      </div>
    </div>
  );
}
