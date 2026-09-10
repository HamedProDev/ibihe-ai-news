import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure']
  }
});

export const RSS_SOURCES = [
  { name: 'igihe.com', url: 'https://igihe.com/feed/', lang: 'rw', category: 'amahanga' },
  { name: 'KT Press', url: 'https://www.ktpress.rw/feed/', lang: 'en', category: 'amahanga' },
  { name: 'The New Times', url: 'https://www.newtimes.co.rw/rss.xml', lang: 'en', category: 'amahanga' },
  { name: 'BBC Gahuzamiryango', url: 'https://feeds.bbci.co.uk/african/rss.xml', lang: 'en', category: 'amahanga' },
];

export async function fetchRSSFeed(url: string, source: string) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map(item => ({
      title: item.title || '',
      excerpt: item.contentSnippet || item.content?.slice(0, 200) || '',
      sourceUrl: item.link || '',
      source,
      publishedAt: item.pubDate || new Date().toISOString(),
      imageUrl: (item as any)['media:content']?.$.url || 
                (item as any)['media:thumbnail']?.$.url ||
                item.enclosure?.url || undefined,
    }));
  } catch (error) {
    console.error(`Failed to fetch RSS from ${url}:`, error);
    return [];
  }
}

export async function fetchAllFeeds() {
  const results = await Promise.allSettled(
    RSS_SOURCES.map(src => fetchRSSFeed(src.url, src.name))
  );
  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<any[]>).value);
}
