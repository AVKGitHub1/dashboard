import { api } from './client';

export interface DashboardSave {
  id: number;
  name: string;
  created_at: string;
}

export const savesApi = {
  list: () => api.get<DashboardSave[]>('/saves').then((r) => r.data),
  create: (name: string) => api.post<{ id: number; name: string }>('/saves', { name }).then((r) => r.data),
  load: (id: number) => api.post(`/saves/${id}/load`),
  remove: (id: number) => api.delete(`/saves/${id}`),
};
