import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Quote, stocksApi, TimeRange, WatchlistItem } from '../../../api/stocks';
import { useUiStore } from '../../../store/useUiStore';
import PriceChart from './PriceChart';

function fmtChange(change: number | null, pct: number | null) {
  if (change === null || pct === null) return { text: '—', positive: true };
  const positive = change >= 0;
  return { text: `${positive ? '+' : ''}${change.toFixed(2)} (${positive ? '+' : ''}${pct.toFixed(2)}%)`, positive };
}

export default function TickerRow({
  item,
  quote,
  range,
  onRemove,
  dragHandlers,
  isDragging,
}: {
  item: WatchlistItem;
  quote?: Quote;
  range: TimeRange;
  onRemove: (id: number) => void;
  dragHandlers: React.HTMLAttributes<HTMLDivElement>;
  isDragging: boolean;
}) {
  const expandedTicker = useUiStore((s) => s.expandedTicker);
  const setExpandedTicker = useUiStore((s) => s.setExpandedTicker);
  const isExpanded = expandedTicker === item.symbol;

  // For 1D, Finnhub's own quote change/% is authoritative. For longer ranges, derive
  // change from the first candle close vs. current price so it reflects the selected window.
  const { data: candleData } = useQuery({
    queryKey: ['stock-candles', item.symbol, range],
    queryFn: () => stocksApi.candles(item.symbol, range),
    enabled: range !== '1D',
  });

  const change = range === '1D' ? quote?.change ?? null : candleData?.rangeChange ?? null;
  const percentChange = range === '1D' ? quote?.percentChange ?? null : candleData?.rangePercentChange ?? null;
  const { text, positive } = fmtChange(change ?? null, percentChange ?? null);

  return (
    <div
      {...dragHandlers}
      className={`cursor-move rounded-lg border border-slate-800 ${isDragging ? 'opacity-40' : ''}`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between px-2 py-1.5 text-left hover:bg-slate-900/60"
        onClick={() => setExpandedTicker(item.symbol)}
      >
        <div>
          <div className="font-medium text-slate-100">{item.symbol}</div>
          {item.display_name && <div className="text-xs text-slate-500">{item.display_name}</div>}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-slate-100">{quote ? quote.price.toFixed(2) : '—'}</div>
            <div className={positive ? 'text-xs text-emerald-400' : 'text-xs text-red-400'}>{text}</div>
          </div>
          <span
            role="button"
            aria-label={`Remove ${item.symbol}`}
            className="-m-1.5 p-1.5 text-slate-500 hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
          >
            <X size={14} />
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-slate-800 p-2">
          <PriceChart symbol={item.symbol} range={range} />
        </div>
      )}
    </div>
  );
}
