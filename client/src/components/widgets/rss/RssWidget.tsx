import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { rssApi } from '../../../api/rss';
import { Widget } from '../../../api/widgets';
import AddFeedModal from './AddFeedModal';

export default function RssWidget({ widget }: { widget: Widget }) {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data: feeds = [] } = useQuery({
    queryKey: ['rss-feeds', widget.id],
    queryFn: () => rssApi.listFeeds(widget.id),
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['rss-items', widget.id],
    queryFn: () => rssApi.items(widget.id),
    enabled: feeds.length > 0,
    refetchInterval: 5 * 60 * 1000,
  });

  const addFeed = useMutation({
    mutationFn: (feedUrl: string) => rssApi.addFeed(widget.id, feedUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rss-feeds', widget.id] });
      qc.invalidateQueries({ queryKey: ['rss-items', widget.id] });
    },
  });

  // force: true bypasses the server's 5-minute per-feed cache — a plain refetch alone
  // would just hand back the same cached items if you click refresh in between polls.
  const refresh = useMutation({
    mutationFn: () => rssApi.items(widget.id, true),
    onSuccess: (data) => qc.setQueryData(['rss-items', widget.id], data),
  });

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{feeds.length} feed(s)</span>
        <div className="flex items-center gap-3">
          <button
            className="-m-1 p-2 text-slate-400 hover:text-slate-100 disabled:opacity-50"
            title="Refresh now"
            aria-label="Refresh now"
            disabled={refresh.isPending || feeds.length === 0}
            onClick={() => refresh.mutate()}
          >
            <RefreshCw size={13} className={refresh.isPending ? 'animate-spin' : ''} />
          </button>
          <button
            className="-m-1 flex items-center gap-1 p-2 text-xs text-blue-400 hover:text-blue-300"
            onClick={() => setShowModal(true)}
          >
            <Plus size={12} /> Add feed
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-auto">
        {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-slate-500">Add a feed URL to see recent items.</p>
        )}
        {items.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="block rounded-md px-2 py-2 hover:bg-slate-900/60 sm:py-1"
          >
            <div className={`text-sm ${item.error ? 'text-red-400' : 'text-slate-200'}`}>{item.title}</div>
            <div className="text-xs text-slate-500">
              {item.source}
              {item.pubDate ? ` · ${new Date(item.pubDate).toLocaleDateString()}` : ''}
            </div>
          </a>
        ))}
      </div>
      {showModal && <AddFeedModal onSubmit={(url) => addFeed.mutate(url)} onClose={() => setShowModal(false)} />}
    </div>
  );
}
