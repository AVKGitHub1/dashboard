import { ZodError } from 'zod';

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Invalid request', details: err.issues });
  }
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.publicMessage || 'Internal server error' });
}
