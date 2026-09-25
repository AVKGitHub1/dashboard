import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { getMergedFeedItems } from '../services/rss.service.js';

export const rssRouter = Router();

rssRouter.get('/feeds', (req, res) => {
  const widgetId = z.coerce.number().int().parse(req.query.widgetId);
  const rows = db.prepare('SELECT * FROM rss_feeds WHERE widget_id = ? ORDER BY sort_order, id').all(widgetId);
  res.json(rows);
});

const addFeedSchema = z.object({
  widgetId: z.number().int(),
  feedUrl: z.string().url(),
  titleOverride: z.string().optional(),
});

rssRouter.post('/feeds', (req, res) => {
  const body = addFeedSchema.parse(req.body);
  const result = db
    .prepare('INSERT INTO rss_feeds (widget_id, feed_url, title_override) VALUES (?, ?, ?)')
    .run(body.widgetId, body.feedUrl, body.titleOverride || null);
  const row = db.prepare('SELECT * FROM rss_feeds WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

rssRouter.delete('/feeds/:id', (req, res) => {
  db.prepare('DELETE FROM rss_feeds WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

rssRouter.get('/items', async (req, res, next) => {
  try {
    const widgetId = z.coerce.number().int().parse(req.query.widgetId);
    const feeds = db.prepare('SELECT feed_url FROM rss_feeds WHERE widget_id = ?').all(widgetId);
    const force = req.query.force === 'true';
    const items = await getMergedFeedItems(feeds.map((f) => f.feed_url), { force });
    res.json(items);
  } catch (err) {
    next(err);
  }
});
