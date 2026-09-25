import { Router } from 'express';
import { getStats } from '../services/system.service.js';

export const systemRouter = Router();

systemRouter.get('/stats', async (req, res, next) => {
  try {
    res.json(await getStats());
  } catch (err) {
    next(err);
  }
});
