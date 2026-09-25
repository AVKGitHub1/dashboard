import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TodoItem, todosApi } from '../../../api/todos';
import { Widget } from '../../../api/widgets';
import { useDragReorder } from '../../../hooks/useDragReorder';
import { useUpdateWidgetConfig } from '../../../hooks/useWidgets';

type Mode = 'text' | 'checklist';

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
  const [newItem, setNewItem] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['todo-items', widget.id],
    queryFn: () => todosApi.list(widget.id),
  });

  // Keep unchecked items in their existing order, but sink checked ones to the bottom
  // (stable sort so items don't jump around within their own done/not-done group).
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0)),
    [items]
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ['todo-items', widget.id] });
  const addItem = useMutation({ mutationFn: (text: string) => todosApi.add(widget.id, text), onSuccess: invalidate });
  const toggleItem = useMutation({
    mutationFn: ({ id, done }: { id: number; done: boolean }) => todosApi.update(id, { done }),
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

  const { getHandlers, isDragging } = useDragReorder(sortedItems, (next: TodoItem[]) => {
    // Same instant-feedback pattern as the other draggable widgets: update the cache
    // immediately, persist sort_order in the background.
    qc.setQueryData(['todo-items', widget.id], next);
    todosApi.reorder(widget.id, next.map((i) => i.id));
  });

  return (
    <div className="flex h-full flex-col gap-2">
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
        {sortedItems.map((item, index) => (
          <div
            key={item.id}
            {...getHandlers(index)}
            className={`flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-slate-900/60 ${
              isDragging(index) ? 'opacity-40' : ''
            }`}
          >
            <span className="cursor-move select-none text-slate-600">⠿</span>
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 accent-blue-600"
              checked={!!item.done}
              onChange={(e) => toggleItem.mutate({ id: item.id, done: e.target.checked })}
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
                className={`min-w-0 flex-1 cursor-text break-words text-sm ${
                  item.done ? 'text-slate-500 line-through' : 'text-slate-200'
                }`}
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
