import { GripVertical, X } from 'lucide-react';
import { ReactNode } from 'react';
import { getWidgetDefinition } from '../widgets/registry';
import { Widget } from '../../api/widgets';

export default function WidgetFrame({
  widget,
  draggable,
  onRemove,
  children,
}: {
  widget: Widget;
  draggable: boolean;
  onRemove: (id: number) => void;
  children: ReactNode;
}) {
  const def = getWidgetDefinition(widget.type);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
      <div
        className={`widget-drag-handle flex items-center justify-between border-b border-slate-800 px-2 py-1 ${
          draggable ? 'cursor-move' : ''
        }`}
      >
        <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-400">
          {draggable && <GripVertical size={13} className="shrink-0 text-slate-600" />}
          <span className="truncate">{def?.label || widget.type}</span>
        </div>
        {/* react-grid-layout starts a drag on mousedown/touchstart anywhere in
            .widget-drag-handle, which swallows the click on this button unless we stop
            it from propagating. The negative margin keeps the padded 28px touch target
            from pushing the header taller than it is on desktop. */}
        <button
          className="-m-1.5 shrink-0 p-1.5 text-slate-500 hover:text-red-400"
          aria-label="Remove widget"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={() => onRemove(widget.id)}
        >
          <X size={14} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
