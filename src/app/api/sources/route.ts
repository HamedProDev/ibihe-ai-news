import { SOURCE_REGISTRY } from '@/lib/news/source-registry';
import { ok } from '@/lib/api/envelope';

/**
 * GET: the public, human-curated source registry. IbiheNews only ingests
 * from these sources — adding one requires a human decision.
 */
export async function GET() {
  const sources = SOURCE_REGISTRY.filter((s) => s.enabled).map((s) => ({
    id: s.id,
    name: s.name,
    homeUrl: s.homeUrl,
    language: s.language,
    trustTier: s.trustTier,
    excerptPolicy: s.excerptPolicy,
    hasFeed: Boolean(s.feedUrl),
  }));
  return ok({ sources }, 'live');
}
