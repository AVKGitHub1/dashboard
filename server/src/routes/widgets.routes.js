import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';

export const widgetsRouter = Router();

const WIDGET_TYPES = ['weather', 'stocks', 'links', 'clock', 'worldclock', 'rss', 'system', 'notes'];

function parseWidget(row) {
  return { ...row, config: JSON.parse(row.config_json || '{}'), config_json: undefined };
}

widgetsRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM widgets ORDER BY id').all();
  res.json(rows.map(parseWidget));
});

const createSchema = z.object({
  type: z.enum(WIDGET_TYPES),
  x: z.number().int().default(0),
  y: z.number().int().default(0),
  w: z.number().int().min(1).default(4),
  h: z.number().int().min(1).default(4),
  config: z.record(z.any()).default({}),
});

widgetsRouter.post('/', (req, res) => {
  const body = createSchema.parse(req.body);
  const result = db
    .prepare('INSERT INTO widgets (type, x, y, w, h, config_json) VALUES (?, ?, ?, ?, ?, ?)')
    .run(body.type, body.x, body.y, body.w, body.h, JSON.stringify(body.config));
  const row = db.prepare('SELECT * FROM widgets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(parseWidget(row));
});

const updateSchema = z.object({ config: z.record(z.any()) });

widgetsRouter.put('/:id', (req, res) => {
  const { config } = updateSchema.parse(req.body);
  const existing = db.prepare('SELECT * FROM widgets WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Widget not found' });
  db.prepare('UPDATE widgets SET config_json = ? WHERE id = ?').run(
    JSON.stringify(config),
    req.params.id
  );
  const row = db.prepare('SELECT * FROM widgets WHERE id = ?').get(req.params.id);
  res.json(parseWidget(row));
});

const layoutSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int(),
      x: z.number().int(),
      y: z.number().int(),
      w: z.number().int().min(1),
      h: z.number().int().min(1),
    })
  ),
});

widgetsRouter.patch('/layout', (req, res) => {
  const { items } = layoutSchema.parse(req.body);
  const update = db.prepare('UPDATE widgets SET x = ?, y = ?, w = ?, h = ? WHERE id = ?');
  const tx = db.transaction((rows) => {
    for (const item of rows) update.run(item.x, item.y, item.w, item.h, item.id);
  });
  tx(items);
  res.status(204).end();
});

widgetsRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM widgets WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
