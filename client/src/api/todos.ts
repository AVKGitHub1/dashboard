import { api } from './client';

export type TodoStatus = 'todo' | 'doing' | 'done';

export interface TodoItem {
  id: number;
  widget_id: number;
  text: string;
  status: TodoStatus;
  sort_order: number;
}

export const todosApi = {
  list: (widgetId: number) => api.get<TodoItem[]>('/todos/items', { params: { widgetId } }).then((r) => r.data),
  add: (widgetId: number, text: string) =>
    api.post<TodoItem>('/todos/items', { widgetId, text }).then((r) => r.data),
  update: (id: number, patch: { text?: string; status?: TodoStatus }) =>
    api.put<TodoItem>(`/todos/items/${id}`, patch).then((r) => r.data),
  remove: (id: number) => api.delete(`/todos/items/${id}`),
  reorder: (widgetId: number, orderedIds: number[]) =>
    api.patch('/todos/items/reorder', { widgetId, orderedIds }),
};
