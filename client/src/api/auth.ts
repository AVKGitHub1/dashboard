import { api } from './client';

export interface Me {
  username: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<Me>('/auth/login', { username, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<Me>('/auth/me').then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};
