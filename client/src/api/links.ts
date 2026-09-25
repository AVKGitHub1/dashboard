import { api } from './client';

export interface Link {
  id: number;
  widget_id: number;
  name: string;
  url: string;
  icon_path: string | null;
}

export interface LinkInput {
  widgetId: number;
  name: string;
  url: string;
  iconFile?: File | null;
  iconUrl?: string;
}

function toFormData(input: LinkInput) {
  const fd = new FormData();
  fd.append('widgetId', String(input.widgetId));
  fd.append('name', input.name);
  fd.append('url', input.url);
  if (input.iconFile) fd.append('icon', input.iconFile);
  else if (input.iconUrl) fd.append('iconUrl', input.iconUrl);
  return fd;
}

export const linksApi = {
  list: (widgetId: number) => api.get<Link[]>('/links', { params: { widgetId } }).then((r) => r.data),
  add: (input: LinkInput) =>
    api
      .post<Link>('/links', toFormData(input), { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  remove: (id: number) => api.delete(`/links/${id}`),
  reorder: (widgetId: number, orderedIds: number[]) => api.patch('/links/reorder', { widgetId, orderedIds }),
};
