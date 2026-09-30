import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TodoItem, TodoStatus, todosApi } from '../../../api/todos';
import { Widget } from '../../../api/widgets';
import { useDragReorder } from '../../../hooks/useDragReorder';
import { useUpdateWidgetConfig } from '../../../hooks/useWidgets';

type Mode = 'text' | 'checklist';

// Listed in the order the checklist shows them.
const STATUSES: TodoStatus[] = ['todo', 'doing', 'done'];

const STATUS_STYLES: Record<TodoStatus, { label: string; text: string; chip: string }> = {
  todo: { label: 'To Do', text: 'text-red-400/75', chip: 'bg-red-950 text-red-300' },
  doing: { label: 'Doing', text: 'text-orange-400', chip: 'bg-orange-950 text-orange-300' },
  done: { label: 'Done', text: 'text-slate-500 line-through', chip: 'bg-slate-700 text-slate-200' },
};

const statusRank = (status: TodoStatus) => STATUSES.indexOf(status);

function TextNotes({ widget }: { widget: Widget }) {
  const updateConfig = useUpdateWidgetConfig();
  const [content, setContent] = useState<string>(widget.config.content || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => setContent(widget.config.content || ''), [widget.id]);

  const onChange = (value: string) => {
    setContent(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateConfig.mutate({ id: widget.id, config: { ...widget.config, content: value } });
    }, 500);
  };

  return (
    <textarea
      className="h-full w-full flex-1 resize-none rounded-md border border-slate-800 bg-slate-900/60 p-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
      placeholder="Type your notes…"
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Checklist({ widget }: { widget: Widget }) {
  const updateConfig = useUpdateWidgetConfig();
  const [newItem, setNewItem] = useState('');
  // Held locally so the chips respond instantly; widget config updates only land in the
  // cache once the server replies.
  const [filter, setFilter] = useState<TodoStatus[]>(widget.config.statusFilter || STATUSES);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['todo-items', widget.id],
    queryFn: () => todosApi.list(widget.id),
  });

  // Group by stage (to do, then doing, then done), keeping each item's existing order
  // within its stage (stable sort, so items don't jump around within their own group).
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => statusRank(a.status) - statusRank(b.status)),
    [items]
  );
  const visibleItems = useMemo(
    () => sortedItems.filter((item) => filter.includes(item.status)),
    [sortedItems, filter]
  );

  const saveFilter = (next: TodoStatus[]) => {
    // Deselecting the last category would leave an empty list, so fall back to all of them.
    const value = next.length ? STATUSES.filter((s) => next.includes(s)) : STATUSES;
    setFilter(value);
    updateConfig.mutate({ id: widget.id, config: { ...widget.config, statusFilter: value } });
  };
  const toggleFilter = (status: TodoStatus) =>
    saveFilter(filter.includes(status) ? filter.filter((s) => s !== status) : [...filter, status]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['todo-items', widget.id] });
  const addItem = useMutation({ mutationFn: (text: string) => todosApi.add(widget.id, text), onSuccess: invalidate });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TodoStatus }) => todosApi.update(id, { status }),
    onSuccess: invalidate,
  });
  const editItem = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => todosApi.update(id, { text }),
    onSuccess: invalidate,
  });
  const removeItem = useMutation({ mutationFn: (id: number) => todosApi.remove(id), onSuccess: invalidate });

  const startEditing = (id: number, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const commitEdit = () => {
    if (editingId === null) return;
    const trimmed = editText.trim();
    if (trimmed) editItem.mutate({ id: editingId, text: trimmed });
    setEditingId(null);
  };

  const { getHandlers, isDragging } = useDragReorder(visibleItems, (next: TodoItem[]) => {
    // Items only reorder within their own stage: a drop that lands in another stage
    // would leave the list out of stage order, so it's ignored.
    if (next.some((item, i) => i > 0 && statusRank(item.status) < statusRank(next[i - 1].status))) return;
    // Filtered-out stages keep their order; the stable sort slots them back in place.
    const hidden = sortedItems.filter((item) => !filter.includes(item.status));
    const full = [...next, ...hidden].sort((a, b) => statusRank(a.status) - statusRank(b.status));
    // Same instant-feedback pattern as the other draggable widgets: update the cache
    // immediately, persist sort_order in the background.
    qc.setQueryData(['todo-items', widget.id], full);
    todosApi.reorder(widget.id, full.map((i) => i.id));
  });

  const allSelected = filter.length === STATUSES.length;
  const chipClass = (active: boolean, activeClass: string) =>
    `rounded px-2 py-1 sm:py-0.5 ${active ? activeClass : 'text-slate-500 hover:text-slate-300'}`;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap gap-1 text-xs">
        <button className={chipClass(allSelected, 'bg-blue-600 text-white')} onClick={() => saveFilter(STATUSES)}>
          All
        </button>
        {STATUSES.map((status) => (
          <button
            key={status}
            className={chipClass(!allSelected && filter.includes(status), STATUS_STYLES[status].chip)}
            onClick={() => (allSelected ? saveFilter([status]) : toggleFilter(status))}
          >
            {STATUS_STYLES[status].label}
          </button>
        ))}
      </div>
      <form
        className="flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newItem.trim()) return;
          addItem.mutate(newItem.trim());
          setNewItem('');
        }}
      >
        <input
          className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100"
          placeholder="Add an item…"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-blue-600 px-3 text-white hover:bg-blue-500"
          aria-label="Add item"
        >
          <Plus size={14} />
        </button>
      </form>
      <div className="flex-1 space-y-1 overflow-auto">
        {visibleItems.map((item, index) => (
          <div
            key={item.id}
            {...getHandlers(index)}
            className={`flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-slate-900/60 ${
              isDragging(index) ? 'opacity-40' : ''
            }`}
          >
            <span className="cursor-move select-none text-slate-600">⠿</span>
            {/* First mark: to do <-> doing. Second mark: doing <-> done. Each is only
                clickable at the stage where it's the next (or last) step. */}
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`${item.text}: doing`}
              checked={item.status !== 'todo'}
              disabled={item.status === 'done'}
              onChange={(e) => setStatus.mutate({ id: item.id, status: e.target.checked ? 'doing' : 'todo' })}
            />
            <input
              type="checkbox"
              className="-ml-1 h-4 w-4 shrink-0 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`${item.text}: done`}
              checked={item.status === 'done'}
              disabled={item.status === 'todo'}
              onChange={(e) => setStatus.mutate({ id: item.id, status: e.target.checked ? 'done' : 'doing' })}
            />
            {editingId === item.id ? (
              <input
                autoFocus
                className="flex-1 rounded border border-blue-500 bg-slate-800 px-1 py-0.5 text-sm text-slate-100 focus:outline-none"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
              />
            ) : (
              <span
                className={`min-w-0 flex-1 cursor-text break-words text-sm ${STATUS_STYLES[item.status].text}`}
                onClick={() => startEditing(item.id, item.text)}
              >
                {item.text}
              </span>
            )}
            <button
              className="-m-1 shrink-0 p-2 text-slate-500 hover:text-red-400"
              aria-label={`Delete ${item.text}`}
              onClick={() => removeItem.mutate(item.id)}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NotesWidget({ widget }: { widget: Widget }) {
  const updateConfig = useUpdateWidgetConfig();
  const mode: Mode = widget.config.mode || 'text';

  const setMode = (newMode: Mode) => updateConfig.mutate({ id: widget.id, config: { ...widget.config, mode: newMode } });

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex gap-1 self-start rounded-md bg-slate-800 p-0.5 text-xs">
        <button
          className={`rounded px-3 py-1.5 sm:px-2 sm:py-0.5 ${
            mode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
          onClick={() => setMode('text')}
        >
          Notes
        </button>
        <button
          className={`rounded px-3 py-1.5 sm:px-2 sm:py-0.5 ${
            mode === 'checklist' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
          onClick={() => setMode('checklist')}
        >
          Checklist
        </button>
      </div>
      <div className="flex-1 overflow-hidden">{mode === 'text' ? <TextNotes widget={widget} /> : <Checklist widget={widget} />}</div>
    </div>
  );
}
