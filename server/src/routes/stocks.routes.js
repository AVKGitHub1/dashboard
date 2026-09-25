import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { stocksProvider } from '../services/stocks.service.js';
import { reorderRows } from '../utils/reorder.js';

export const stocksRouter = Router();

stocksRouter.get('/search', async (req, res, next) => {
  try {
    const q = z.string().min(1).parse(req.query.q);
    res.json(await stocksProvider.search(q));
  } catch (err) {
    next(err);
  }
});

stocksRouter.get('/watchlist', (req, res) => {
  const widgetId = z.coerce.number().int().parse(req.query.widgetId);
  const rows = db
    .prepare('SELECT * FROM stock_watchlist WHERE widget_id = ? ORDER BY sort_order, id')
    .all(widgetId);
  res.json(rows);
});

const addTickerSchema = z.object({
  widgetId: z.number().int(),
  symbol: z.string().min(1),
  displayName: z.string().optional(),
});

stocksRouter.post('/watchlist', (req, res) => {
  const body = addTickerSchema.parse(req.body);
  const result = db
    .prepare('INSERT INTO stock_watchlist (widget_id, symbol, display_name) VALUES (?, ?, ?)')
    .run(body.widgetId, body.symbol.toUpperCase(), body.displayName || null);
  const row = db.prepare('SELECT * FROM stock_watchlist WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

stocksRouter.delete('/watchlist/:id', (req, res) => {
  db.prepare('DELETE FROM stock_watchlist WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

const reorderSchema = z.object({
  widgetId: z.number().int(),
  orderedIds: z.array(z.number().int()),
});

stocksRouter.patch('/watchlist/reorder', (req, res) => {
  const { widgetId, orderedIds } = reorderSchema.parse(req.body);
  reorderRows('stock_watchlist', widgetId, orderedIds);
  res.status(204).end();
});

stocksRouter.get('/quotes', async (req, res, next) => {
  try {
    const symbols = z
      .string()
      .min(1)
      .parse(req.query.symbols)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    res.json(await stocksProvider.getQuotes(symbols));
  } catch (err) {
    next(err);
  }
});

stocksRouter.get('/candles', async (req, res, next) => {
  try {
    const symbol = z.string().min(1).parse(req.query.symbol);
    const range = z.enum(['1D', '1W', '1M', '1Y']).default('1W').parse(req.query.range);
    res.json(await stocksProvider.getCandles(symbol, range));
  } catch (err) {
    next(err);
  }
});
