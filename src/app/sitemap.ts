import type { MetadataRoute } from 'next';
import { COMMODITY_IDS } from '@/lib/market/commodities';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ibihe.rw';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/amakuru', '/ubuhinzi', '/isoko', '/ikirere', '/ubukungu', '/ibisobanuro', '/ibimenyetso', '/baza'];
  const now = new Date();
  return [
    ...staticRoutes.map((r) => ({
      url: `${BASE}${r || '/'}`,
      lastModified: now,
      changeFrequency: 'hourly' as const,
      priority: r === '' ? 1 : 0.8,
    })),
    ...COMMODITY_IDS.map((c) => ({
      url: `${BASE}/isoko/${c}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ];
}
