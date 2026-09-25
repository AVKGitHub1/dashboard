import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import RGL, { Layout, WidthProvider } from 'react-grid-layout';
import { LayoutItem, Widget } from '../../api/widgets';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useRemoveWidget, useUpdateLayout, useWidgets } from '../../hooks/useWidgets';
import { getWidgetDefinition } from '../widgets/registry';
import WidgetFrame from './WidgetFrame';

const ReactGridLayout = WidthProvider(RGL);

export default function DashboardGrid() {
  const { data: widgets = [], isLoading } = useWidgets();
  const updateLayout = useUpdateLayout();
  const removeWidget = useRemoveWidget();
  const isMobile = useIsMobile();
  const qc = useQueryClient();

  // A phone is ~375px across, so the desktop 12-column grid would give each column
  // about 30px and squeeze every widget down to an unreadable sliver. Mobile instead
  // stacks the widgets into one full-width column, ordered the way they read on the
  // desktop grid (top-to-bottom, then left-to-right within a row).
  const layout: Layout[] = useMemo(() => {
    if (!isMobile) {
      return widgets.map((w) => ({ i: String(w.id), x: w.x, y: w.y, w: w.w, h: w.h }));
    }
    let y = 0;
    return [...widgets]
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((w) => {
        const item = { i: String(w.id), x: 0, y, w: 1, h: w.h };
        y += w.h;
        return item;
      });
  }, [widgets, isMobile]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      const items: LayoutItem[] = newLayout.map((l) => ({
        id: Number(l.i),
        x: l.x,
        y: l.y,
        w: l.w,
        h: l.h,
      }));
      // Write the new positions/sizes into the cache immediately, rather than waiting
      // on the PATCH to resolve — otherwise any unrelated re-render (e.g. a widget's
      // own background refetch) rebuilds `layout` from the still-stale query data and
      // the grid visibly snaps back to the pre-drag/resize size.
      qc.setQueryData<Widget[]>(['widgets'], (old) =>
        old?.map((w) => {
          const item = items.find((i) => i.id === w.id);
          return item ? { ...w, x: item.x, y: item.y, w: item.w, h: item.h } : w;
        })
      );
      updateLayout.mutate(items);
    },
    [updateLayout, qc]
  );

  if (isLoading) {
    return <div className="p-6 text-slate-500">Loading dashboard…</div>;
  }

  if (widgets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-slate-500">
        No widgets yet — tap “Add widget” to place one.
      </div>
    );
  }

  return (
    <ReactGridLayout
      className={isMobile ? 'p-2' : 'p-4'}
      layout={layout}
      cols={isMobile ? 1 : 12}
      rowHeight={32}
      margin={isMobile ? [8, 8] : [12, 12]}
      draggableHandle=".widget-drag-handle"
      // Each widget persists a single x/y/w/h, so letting the one-column mobile view
      // move or resize anything would write those collapsed coordinates back and
      // flatten the desktop layout it was derived from. Mobile is read-only; a drag
      // there would also fight the page scroll.
      isDraggable={!isMobile}
      isResizable={!isMobile}
      onDragStop={handleLayoutChange}
      onResizeStop={handleLayoutChange}
    >
      {widgets.map((widget) => {
        const def = getWidgetDefinition(widget.type);
        if (!def) return null;
        const Component = def.Component;
        return (
          <div key={String(widget.id)}>
            <WidgetFrame
              widget={widget}
              draggable={!isMobile}
              onRemove={(id) => removeWidget.mutate(id)}
            >
              <Component widget={widget} />
            </WidgetFrame>
          </div>
        );
      })}
    </ReactGridLayout>
  );
}
