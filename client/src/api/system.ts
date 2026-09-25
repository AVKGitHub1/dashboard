import { api } from './client';

export interface SystemStats {
  cpuPercent: number;
  memUsedMB: number;
  memTotalMB: number;
  diskUsedGB: number;
  diskTotalGB: number;
}

export const systemApi = {
  stats: () => api.get<SystemStats>('/system/stats').then((r) => r.data),
};
