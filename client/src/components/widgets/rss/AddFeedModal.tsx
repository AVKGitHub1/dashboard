import { useForm } from 'react-hook-form';

interface FormValues {
  feedUrl: string;
}

export default function AddFeedModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (feedUrl: string) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit } = useForm<FormValues>();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        className="max-h-[85dvh] w-full max-w-sm space-y-3 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit((values) => {
          onSubmit(values.feedUrl);
          onClose();
        })}
      >
        <h2 className="font-medium text-slate-100">Add RSS feed</h2>
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="https://example.com/feed.xml"
          {...register('feedUrl', { required: true })}
        />
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
