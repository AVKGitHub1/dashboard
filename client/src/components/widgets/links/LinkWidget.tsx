import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Link, LinkInput, linksApi } from '../../../api/links';
import { Widget } from '../../../api/widgets';
import { useDragReorder } from '../../../hooks/useDragReorder';
import AddLinkModal from './AddLinkModal';

export default function LinkWidget({ widget }: { widget: Widget }) {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data: links = [] } = useQuery({
    queryKey: ['links', widget.id],
    queryFn: () => linksApi.list(widget.id),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['links', widget.id] });
  const addLink = useMutation({ mutationFn: (input: LinkInput) => linksApi.add(input), onSuccess: invalidate });
  const removeLink = useMutation({ mutationFn: (id: number) => linksApi.remove(id), onSuccess: invalidate });

  const { getHandlers, isDragging } = useDragReorder(links, (next: Link[]) => {
    qc.setQueryData(['links', widget.id], next);
    linksApi.reorder(widget.id, next.map((l) => l.id));
  });

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="grid flex-1 content-start gap-2 overflow-auto grid-cols-[repeat(auto-fill,minmax(76px,1fr))]">
        {links.map((link, index) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            {...getHandlers(index)}
            className={`group relative flex cursor-move flex-col items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-2 hover:border-blue-600 ${
              isDragging(index) ? 'opacity-40' : ''
            }`}
          >
            <button
              type="button"
              className="hover-reveal absolute right-0 top-0 p-1.5 text-slate-500 hover:text-red-400"
              aria-label={`Remove ${link.name}`}
              onClick={(e) => {
                e.preventDefault();
                removeLink.mutate(link.id);
              }}
            >
              <X size={12} />
            </button>
            {link.icon_path ? (
              <img src={link.icon_path} alt="" className="h-8 w-8 rounded object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-xs text-slate-400">
                {link.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="w-full truncate text-center text-xs text-slate-300">{link.name}</span>
          </a>
        ))}
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-700 p-2 text-slate-500 hover:border-blue-600 hover:text-blue-400"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          <span className="text-xs">Add link</span>
        </button>
      </div>
      {showModal && (
        <AddLinkModal
          widgetId={widget.id}
          onSubmit={(input) => addLink.mutate(input)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
