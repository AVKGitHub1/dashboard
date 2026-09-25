import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutItem, Widget, WidgetType, widgetsApi } from '../api/widgets';

export function useWidgets() {
  return useQuery({ queryKey: ['widgets'], queryFn: widgetsApi.list });
}

export function useAddWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, size, y }: { type: WidgetType; size: { w: number; h: number }; y: number }) =>
      widgetsApi.create(type, size, 0, y),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['widgets'] }),
  });
}

export function useUpdateWidgetConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, config }: { id: number; config: Record<string, any> }) =>
      widgetsApi.updateConfig(id, config),
    onSuccess: (updated) => {
      qc.setQueryData<Widget[]>(['widgets'], (old) =>
        old ? old.map((w) => (w.id === updated.id ? updated : w)) : old
      );
    },
  });
}

export function useUpdateLayout() {
  return useMutation({ mutationFn: (items: LayoutItem[]) => widgetsApi.updateLayout(items) });
}

export function useRemoveWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => widgetsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['widgets'] }),
  });
}
