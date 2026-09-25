import { getApiKey } from './apiKeys.service.js';

const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

class MissingApiKeyError extends Error {
  constructor() {
    super('OpenWeatherMap API key is not configured');
    this.status = 400;
    this.publicMessage = 'OpenWeatherMap API key is not configured. Add it in Settings.';
  }
}

// Surfaces OpenWeatherMap's own error message to the client instead of a generic 500,
// so a bad/inactive/rate-limited key is diagnosable from the UI, not just server logs.
// New OWM keys can take up to ~2 hours to activate — the #1 cause of a 401 here on a
// freshly-created key.
class UpstreamError extends Error {
  constructor(status, owmMessage) {
    super(`OpenWeatherMap request failed: ${status} ${owmMessage || ''}`);
    this.status = status === 401 ? 401 : 502;
    this.publicMessage =
      status === 401
        ? `OpenWeatherMap rejected the API key (${owmMessage || 'invalid key'}). New keys can take up to 2 hours to activate — double check it in Settings and retry shortly if it was just created.`
        : `OpenWeatherMap request failed (${owmMessage || status}).`;
  }
}

function requireKey() {
  const key = getApiKey('openweathermap');
  if (!key) throw new MissingApiKeyError();
  return key;
}

async function throwUpstreamError(res) {
  let message;
  try {
    message = (await res.json()).message;
  } catch {
    // response body wasn't JSON; fall back to just the status code
  }
  throw new UpstreamError(res.status, message);
}

export async function searchCities(query) {
  const key = requireKey();
  const url = `${GEO_URL}?q=${encodeURIComponent(query)}&limit=5&appid=${key}`;
  const res = await fetch(url);
  if (!res.ok) await throwUpstreamError(res);
  const results = await res.json();
  return results.map((r) => ({
    name: r.name,
    country: r.country,
    state: r.state,
    lat: r.lat,
    lon: r.lon,
  }));
}

/** Current conditions + a short forecast strip for a single city. */
export async function getCurrentAndForecast({ lat, lon }, units = 'metric') {
  const key = requireKey();
  const [currentRes, forecastRes] = await Promise.all([
    fetch(`${WEATHER_URL}?lat=${lat}&lon=${lon}&units=${units}&appid=${key}`),
    fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}&units=${units}&appid=${key}&cnt=8`),
  ]);
  if (!currentRes.ok) await throwUpstreamError(currentRes);
  if (!forecastRes.ok) await throwUpstreamError(forecastRes);

  const current = await currentRes.json();
  const forecast = await forecastRes.json();

  return {
    current: {
      temp: current.main?.temp,
      feelsLike: current.main?.feels_like,
      condition: current.weather?.[0]?.main,
      description: current.weather?.[0]?.description,
      icon: current.weather?.[0]?.icon,
      humidity: current.main?.humidity,
      windSpeed: current.wind?.speed,
    },
    forecast: (forecast.list || []).map((item) => ({
      dt: item.dt,
      temp: item.main?.temp,
      icon: item.weather?.[0]?.icon,
      condition: item.weather?.[0]?.main,
    })),
  };
}
