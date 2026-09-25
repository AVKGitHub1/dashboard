import { X } from 'lucide-react';
import { useWidgets } from '../../hooks/useWidgets';
import { useAddWidget } from '../../hooks/useWidgets';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useUiStore } from '../../store/useUiStore';
import { WIDGET_REGISTRY, WidgetDefinition } from '../widgets/registry';

export default function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { data: widgets = [] } = useWidgets();
  const addWidget = useAddWidget();
  const isMobile = useIsMobile();

  if (!sidebarOpen) return null;

  // Place new widgets below the current lowest widget so they don't overlap.
  const nextY = widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);

  const add = (def: WidgetDefinition) => {
    addWidget.mutate({ type: def.type, size: def.defaultSize, y: nextY });
    // On a phone the panel covers the whole screen, so leaving it open after an add
    // hides the very widget that was just created.
    if (isMobile) toggleSidebar();
  };

  return (
    <>
      {/* Tapping outside is the gesture people reach for first on touch, where the panel
          is full-bleed and the close button is a long thumb-stretch away. Mobile-only:
          on desktop the panel sits beside a still-usable dashboard, and a page-wide
          backdrop would swallow the first click of every drag. */}
      {isMobile && <div className="fixed inset-0 z-30 bg-black/50" onClick={toggleSidebar} />}
      <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="font-medium text-slate-100">Add a widget</h2>
          <button
            className="-m-2 p-2 text-slate-500 hover:text-slate-200"
            aria-label="Close"
            onClick={toggleSidebar}
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-auto p-3">
          {WIDGET_REGISTRY.map((def) => (
            <button
              key={def.type}
              className="flex w-full items-start gap-3 rounded-lg border border-slate-800 p-3 text-left hover:border-blue-600 hover:bg-slate-800/50"
              onClick={() => add(def)}
            >
              <def.icon size={20} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-100">{def.label}</div>
                <div className="text-xs text-slate-500">{def.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
