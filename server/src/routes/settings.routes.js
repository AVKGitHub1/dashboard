import { Router } from 'express';
import { z } from 'zod';
import {
  deleteApiKey,
  getConfiguredStatus,
  isKnownProvider,
  setApiKey,
} from '../services/apiKeys.service.js';

export const settingsRouter = Router();

settingsRouter.get('/api-keys', (req, res) => {
  res.json(getConfiguredStatus());
});

const setKeySchema = z.object({ apiKey: z.string().min(1) });

settingsRouter.put('/api-keys/:provider', (req, res) => {
  const { provider } = req.params;
  if (!isKnownProvider(provider)) return res.status(404).json({ error: 'Unknown provider' });
  const { apiKey } = setKeySchema.parse(req.body);
  setApiKey(provider, apiKey);
  res.status(204).end();
});

settingsRouter.delete('/api-keys/:provider', (req, res) => {
  const { provider } = req.params;
  if (!isKnownProvider(provider)) return res.status(404).json({ error: 'Unknown provider' });
  deleteApiKey(provider);
  res.status(204).end();
});
