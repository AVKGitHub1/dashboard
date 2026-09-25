import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LinkInput } from '../../../api/links';

interface FormValues {
  name: string;
  url: string;
  iconUrl: string;
}

export default function AddLinkModal({
  widgetId,
  onSubmit,
  onClose,
}: {
  widgetId: number;
  onSubmit: (input: LinkInput) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit, reset } = useForm<FormValues>();
  const [mode, setMode] = useState<'upload' | 'url'>('url');
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        className="max-h-[85dvh] w-full max-w-sm space-y-3 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit((values) => {
          onSubmit({
            widgetId,
            name: values.name,
            url: values.url,
            iconFile: mode === 'upload' ? file : null,
            iconUrl: mode === 'url' ? values.iconUrl : undefined,
          });
          reset();
          onClose();
        })}
      >
        <h2 className="font-medium text-slate-100">Add link</h2>
        <div className="space-y-1">
          <label className="text-sm text-slate-400">Name</label>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
            {...register('name', { required: true })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-400">URL</label>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="https://example.com"
            {...register('url', { required: true })}
          />
        </div>
        <div className="space-y-1">
          <div className="flex gap-3 text-sm text-slate-400">
            <label className="flex items-center gap-1.5 py-1">
              <input
                type="radio"
                className="h-4 w-4 accent-blue-600"
                checked={mode === 'url'}
                onChange={() => setMode('url')}
              />
              Icon URL
            </label>
            <label className="flex items-center gap-1.5 py-1">
              <input
                type="radio"
                className="h-4 w-4 accent-blue-600"
                checked={mode === 'upload'}
                onChange={() => setMode('upload')}
              />
              Upload icon
            </label>
          </div>
          {mode === 'url' ? (
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="https://example.com/icon.png (optional)"
              {...register('iconUrl')}
            />
          ) : (
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-slate-400 file:mr-2 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:text-slate-200"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="px-3 py-2 text-sm text-slate-400 sm:py-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 sm:py-1">
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
