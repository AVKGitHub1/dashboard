import { Router } from 'express';
import { z } from 'zod';
import { createSave, deleteSave, listSaves, loadSave } from '../services/dashboardSaves.service.js';

export const savesRouter = Router();

savesRouter.get('/', (req, res) => {
  res.json(listSaves());
});

const createSchema = z.object({ name: z.string().min(1).max(80) });

savesRouter.post('/', (req, res) => {
  const { name } = createSchema.parse(req.body);
  res.status(201).json(createSave(name));
});

savesRouter.post('/:id/load', (req, res) => {
  const ok = loadSave(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Save not found' });
  res.status(204).end();
});

savesRouter.delete('/:id', (req, res) => {
  deleteSave(req.params.id);
  res.status(204).end();
});
