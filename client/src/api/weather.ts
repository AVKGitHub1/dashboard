import { api } from './client';

export interface CityResult {
  name: string;
  country?: string;
  state?: string;
  lat: number;
  lon: number;
}

export interface WeatherCity {
  id: number;
  widget_id: number;
  city_name: string;
  lat: number;
  lon: number;
  country?: string;
}

export interface WeatherCurrent {
  city: WeatherCity;
  current: {
    temp: number;
    feelsLike: number;
    condition: string;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  } | null;
  forecast: { dt: number; temp: number; icon: string; condition: string }[];
  error: string | null;
}

export const weatherApi = {
  search: (q: string) => api.get<CityResult[]>('/weather/search', { params: { q } }).then((r) => r.data),
  listCities: (widgetId: number) =>
    api.get<WeatherCity[]>('/weather/cities', { params: { widgetId } }).then((r) => r.data),
  addCity: (widgetId: number, city: CityResult) =>
    api
      .post<WeatherCity>('/weather/cities', {
        widgetId,
        cityName: city.name,
        lat: city.lat,
        lon: city.lon,
        country: city.country,
      })
      .then((r) => r.data),
  removeCity: (id: number) => api.delete(`/weather/cities/${id}`),
  reorderCities: (widgetId: number, orderedIds: number[]) =>
    api.patch('/weather/cities/reorder', { widgetId, orderedIds }),
  current: (widgetId: number) =>
    api.get<WeatherCurrent[]>('/weather/current', { params: { widgetId } }).then((r) => r.data),
};
