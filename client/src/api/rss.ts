import { api } from './client';

export interface RssFeed {
  id: number;
  widget_id: number;
  feed_url: string;
  title_override?: string;
}

export interface RssItem {
  title: string;
  link: string;
  pubDate: string | null;
  source: string;
  error?: boolean;
}

export const rssApi = {
  listFeeds: (widgetId: number) => api.get<RssFeed[]>('/rss/feeds', { params: { widgetId } }).then((r) => r.data),
  addFeed: (widgetId: number, feedUrl: string, titleOverride?: string) =>
    api.post<RssFeed>('/rss/feeds', { widgetId, feedUrl, titleOverride }).then((r) => r.data),
  removeFeed: (id: number) => api.delete(`/rss/feeds/${id}`),
  items: (widgetId: number, force = false) =>
    api.get<RssItem[]>('/rss/items', { params: { widgetId, force: force || undefined } }).then((r) => r.data),
};
