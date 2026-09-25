import { getApiKey } from './apiKeys.service.js';

const BASE_URL = 'https://finnhub.io/api/v1';
const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

class MissingApiKeyError extends Error {
  constructor() {
    super('Finnhub API key is not configured');
    this.status = 400;
    this.publicMessage = 'Finnhub API key is not configured. Add it in Settings.';
  }
}

function requireKey() {
  const key = getApiKey('finnhub');
  if (!key) throw new MissingApiKeyError();
  return key;
}

/**
 * Small provider-adapter surface (search/getQuote/getCandles). Quotes and search stay
 * on Finnhub (reliable, key-gated, and already the API key the user configures);
 * candles are served from Yahoo Finance's unofficial chart endpoint instead — see
 * getCandles below for why.
 */
export const finnhubProvider = {
  async search(query) {
    const key = requireKey();
    const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Finnhub search failed: ${res.status}`);
    const data = await res.json();
    // Finnhub tags ETFs as "ETP" (Exchange-Traded Product), not "ETF" — VOO/VOOG/VOOV
    // and friends were being silently dropped when this only allowed Common Stock/ADR.
    const ALLOWED_TYPES = new Set(['Common Stock', 'ADR', 'ETP', 'REIT']);
    return (data.result || [])
      .filter((r) => ALLOWED_TYPES.has(r.type))
      .slice(0, 10)
      .map((r) => ({ symbol: r.symbol, description: r.description }));
  },

  async getQuote(symbol) {
    const key = requireKey();
    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Finnhub quote failed: ${res.status}`);
    const q = await res.json();
    return {
      symbol,
      price: q.c,
      change: q.d,
      percentChange: q.dp,
      previousClose: q.pc,
    };
  },

  async getQuotes(symbols) {
    return Promise.all(symbols.map((s) => this.getQuote(s)));
  },
};

// Finnhub's free tier no longer includes /stock/candle for most US equities (it returns
// {s: "no_data"} regardless of range) — the exact risk flagged when this provider-adapter
// was designed. Stooq's CSV export (the originally planned free fallback) now sits behind
// a JS proof-of-work bot challenge that a server-side fetch can't solve. Yahoo Finance's
// unofficial (undocumented, keyless) chart endpoint is what's left: it works today and
// even covers real intraday granularity, but — being unofficial — it could change or get
// rate-limited without notice; getCandles is the one function to revisit if that happens.
const RANGE_PARAMS = {
  '1D': { range: '1d', interval: '5m' },
  '1W': { range: '5d', interval: '30m' },
  '1M': { range: '1mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
};

async function getYahooCandles(symbol, range) {
  const { range: r, interval } = RANGE_PARAMS[range] || RANGE_PARAMS['1W'];
  const url = `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}?range=${r}&interval=${interval}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) return [];

  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) return [];

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const candles = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = quote.close?.[i];
    if (close == null) continue; // Yahoo leaves gaps (pre/post-market, halts) as null
    candles.push({
      time: timestamps[i],
      open: quote.open?.[i] ?? close,
      high: quote.high?.[i] ?? close,
      low: quote.low?.[i] ?? close,
      close,
    });
  }
  return candles;
}

async function getCandles(symbol, range) {
  const candles = await getYahooCandles(symbol, range);

  let rangeChange = null;
  let rangePercentChange = null;
  if (candles.length > 1) {
    const first = candles[0].close;
    const last = candles[candles.length - 1].close;
    rangeChange = last - first;
    rangePercentChange = first !== 0 ? (rangeChange / first) * 100 : null;
  }

  return { candles, rangeChange, rangePercentChange, note: null };
}

export const stocksProvider = {
  search: (query) => finnhubProvider.search(query),
  getQuote: (symbol) => finnhubProvider.getQuote(symbol),
  getQuotes: (symbols) => finnhubProvider.getQuotes(symbols),
  getCandles,
};
