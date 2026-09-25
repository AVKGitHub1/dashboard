import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { db } from '../db/index.js';
import { uploadIcon } from '../middleware/upload.js';
import { config } from '../config.js';
import { reorderRows } from '../utils/reorder.js';

export const linksRouter = Router();

linksRouter.get('/', (req, res) => {
  const widgetId = z.coerce.number().int().parse(req.query.widgetId);
  const rows = db.prepare('SELECT * FROM links WHERE widget_id = ? ORDER BY sort_order, id').all(widgetId);
  res.json(rows);
});

const bodySchema = z.object({
  widgetId: z.coerce.number().int(),
  name: z.string().min(1),
  url: z.string().url(),
  iconUrl: z.string().url().optional(),
});

linksRouter.post('/', uploadIcon.single('icon'), (req, res, next) => {
  try {
    const body = bodySchema.parse(req.body);
    const iconPath = req.file ? `/uploads/icons/${req.file.filename}` : body.iconUrl || null;
    const result = db
      .prepare('INSERT INTO links (widget_id, name, url, icon_path) VALUES (?, ?, ?, ?)')
      .run(body.widgetId, body.name, body.url, iconPath);
    const row = db.prepare('SELECT * FROM links WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

linksRouter.put('/:id', uploadIcon.single('icon'), (req, res, next) => {
  try {
    const body = bodySchema.partial({ widgetId: true }).parse(req.body);
    const existing = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Link not found' });

    const iconPath = req.file ? `/uploads/icons/${req.file.filename}` : body.iconUrl ?? existing.icon_path;
    db.prepare('UPDATE links SET name = ?, url = ?, icon_path = ? WHERE id = ?').run(
      body.name ?? existing.name,
      body.url ?? existing.url,
      iconPath,
      req.params.id
    );
    res.json(db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id));
  } catch (err) {
    next(err);
  }
});

const reorderSchema = z.object({
  widgetId: z.number().int(),
  orderedIds: z.array(z.number().int()),
});

linksRouter.patch('/reorder', (req, res) => {
  const { widgetId, orderedIds } = reorderSchema.parse(req.body);
  reorderRows('links', widgetId, orderedIds);
  res.status(204).end();
});

linksRouter.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
  if (existing?.icon_path?.startsWith('/uploads/')) {
    const filePath = path.join(config.uploadsDir, existing.icon_path.replace('/uploads/', ''));
    fs.unlink(filePath, () => {});
  }
  db.prepare('DELETE FROM links WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
