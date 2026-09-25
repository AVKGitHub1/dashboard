import { api } from './client';

export type TimeRange = '1D' | '1W' | '1M' | '1Y';

export interface TickerSearchResult {
  symbol: string;
  description: string;
}

export interface WatchlistItem {
  id: number;
  widget_id: number;
  symbol: string;
  display_name?: string;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  percentChange: number;
  previousClose: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandleResponse {
  candles: Candle[];
  rangeChange: number | null;
  rangePercentChange: number | null;
  note: string | null;
}

export const stocksApi = {
  search: (q: string) => api.get<TickerSearchResult[]>('/stocks/search', { params: { q } }).then((r) => r.data),
  listWatchlist: (widgetId: number) =>
    api.get<WatchlistItem[]>('/stocks/watchlist', { params: { widgetId } }).then((r) => r.data),
  addTicker: (widgetId: number, symbol: string, displayName?: string) =>
    api.post<WatchlistItem>('/stocks/watchlist', { widgetId, symbol, displayName }).then((r) => r.data),
  removeTicker: (id: number) => api.delete(`/stocks/watchlist/${id}`),
  reorderWatchlist: (widgetId: number, orderedIds: number[]) =>
    api.patch('/stocks/watchlist/reorder', { widgetId, orderedIds }),
  quotes: (symbols: string[]) =>
    api.get<Quote[]>('/stocks/quotes', { params: { symbols: symbols.join(',') } }).then((r) => r.data),
  candles: (symbol: string, range: TimeRange) =>
    api.get<CandleResponse>('/stocks/candles', { params: { symbol, range } }).then((r) => r.data),
};
