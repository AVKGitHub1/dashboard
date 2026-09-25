import { api } from './client';

export type WidgetType = 'weather' | 'stocks' | 'links' | 'clock' | 'worldclock' | 'rss' | 'system' | 'notes';

export interface Widget {
  id: number;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  config: Record<string, any>;
}

export interface LayoutItem {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const widgetsApi = {
  list: () => api.get<Widget[]>('/widgets').then((r) => r.data),
  create: (type: WidgetType, size: { w: number; h: number }, x = 0, y = 0, config = {}) =>
    api.post<Widget>('/widgets', { type, x, y, ...size, config }).then((r) => r.data),
  updateConfig: (id: number, config: Record<string, any>) =>
    api.put<Widget>(`/widgets/${id}`, { config }).then((r) => r.data),
  updateLayout: (items: LayoutItem[]) => api.patch('/widgets/layout', { items }),
  remove: (id: number) => api.delete(`/widgets/${id}`),
};
