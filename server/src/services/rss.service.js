import Parser from 'rss-parser';

const parser = new Parser();
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // feedUrl -> { fetchedAt, items }

export async function getFeedItems(feedUrl, { force = false } = {}) {
  const cached = cache.get(feedUrl);
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.items;
  }

  const feed = await parser.parseURL(feedUrl);
  const items = (feed.items || []).slice(0, 20).map((item) => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate || item.isoDate,
    source: feed.title,
  }));

  cache.set(feedUrl, { fetchedAt: Date.now(), items });
  return items;
}

export async function getMergedFeedItems(feedUrls, { force = false } = {}) {
  const results = await Promise.allSettled(feedUrls.map((url) => getFeedItems(url, { force })));
  const merged = [];
  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      merged.push(...result.value);
    } else {
      merged.push({
        title: `Failed to load feed: ${feedUrls[idx]}`,
        link: feedUrls[idx],
        pubDate: null,
        source: 'error',
        error: true,
      });
    }
  });
  return merged.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
}
