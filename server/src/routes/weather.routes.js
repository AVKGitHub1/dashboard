import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { getCurrentAndForecast, searchCities } from '../services/weather.service.js';
import { reorderRows } from '../utils/reorder.js';

export const weatherRouter = Router();

weatherRouter.get('/search', async (req, res, next) => {
  try {
    const q = z.string().min(1).parse(req.query.q);
    res.json(await searchCities(q));
  } catch (err) {
    next(err);
  }
});

weatherRouter.get('/cities', (req, res) => {
  const widgetId = z.coerce.number().int().parse(req.query.widgetId);
  const rows = db
    .prepare('SELECT * FROM weather_cities WHERE widget_id = ? ORDER BY sort_order, id')
    .all(widgetId);
  res.json(rows);
});

const addCitySchema = z.object({
  widgetId: z.number().int(),
  cityName: z.string().min(1),
  lat: z.number(),
  lon: z.number(),
  country: z.string().optional(),
});

weatherRouter.post('/cities', (req, res) => {
  const body = addCitySchema.parse(req.body);
  const result = db
    .prepare(
      'INSERT INTO weather_cities (widget_id, city_name, lat, lon, country) VALUES (?, ?, ?, ?, ?)'
    )
    .run(body.widgetId, body.cityName, body.lat, body.lon, body.country || null);
  const row = db.prepare('SELECT * FROM weather_cities WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

weatherRouter.delete('/cities/:id', (req, res) => {
  db.prepare('DELETE FROM weather_cities WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

const reorderSchema = z.object({
  widgetId: z.number().int(),
  orderedIds: z.array(z.number().int()),
});

weatherRouter.patch('/cities/reorder', (req, res) => {
  const { widgetId, orderedIds } = reorderSchema.parse(req.body);
  reorderRows('weather_cities', widgetId, orderedIds);
  res.status(204).end();
});

weatherRouter.get('/current', async (req, res, next) => {
  try {
    const widgetId = z.coerce.number().int().parse(req.query.widgetId);
    const units = req.query.units === 'imperial' ? 'imperial' : 'metric';
    const cities = db
      .prepare('SELECT * FROM weather_cities WHERE widget_id = ? ORDER BY sort_order, id')
      .all(widgetId);

    const results = await Promise.all(
      cities.map(async (city) => {
        try {
          const data = await getCurrentAndForecast({ lat: city.lat, lon: city.lon }, units);
          return { city, ...data, error: null };
        } catch (err) {
          return { city, current: null, forecast: [], error: err.message };
        }
      })
    );
    res.json(results);
  } catch (err) {
    next(err);
  }
});
