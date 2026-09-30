import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { reorderRows } from '../utils/reorder.js';

export const todosRouter = Router();

todosRouter.get('/items', (req, res) => {
  const widgetId = z.coerce.number().int().parse(req.query.widgetId);
  const rows = db.prepare('SELECT * FROM todo_items WHERE widget_id = ? ORDER BY sort_order, id').all(widgetId);
  res.json(rows);
});

const createSchema = z.object({
  widgetId: z.number().int(),
  text: z.string().min(1),
});

todosRouter.post('/items', (req, res) => {
  const body = createSchema.parse(req.body);
  const result = db
    .prepare('INSERT INTO todo_items (widget_id, text) VALUES (?, ?)')
    .run(body.widgetId, body.text);
  const row = db.prepare('SELECT * FROM todo_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

const updateSchema = z.object({
  text: z.string().min(1).optional(),
  status: z.enum(['todo', 'doing', 'done']).optional(),
  sortOrder: z.number().int().optional(),
});

todosRouter.put('/items/:id', (req, res) => {
  const body = updateSchema.parse(req.body);
  const existing = db.prepare('SELECT * FROM todo_items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });
  db.prepare('UPDATE todo_items SET text = ?, status = ?, sort_order = ? WHERE id = ?').run(
    body.text ?? existing.text,
    body.status ?? existing.status,
    body.sortOrder ?? existing.sort_order,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM todo_items WHERE id = ?').get(req.params.id));
});

const reorderSchema = z.object({
  widgetId: z.number().int(),
  orderedIds: z.array(z.number().int()),
});

todosRouter.patch('/items/reorder', (req, res) => {
  const { widgetId, orderedIds } = reorderSchema.parse(req.body);
  reorderRows('todo_items', widgetId, orderedIds);
  res.status(204).end();
});

todosRouter.delete('/items/:id', (req, res) => {
  db.prepare('DELETE FROM todo_items WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
