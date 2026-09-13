import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORY_META, CATEGORY_SLUGS, isCategorySlug } from '../../src/lib/news/category-registry.ts';
import { isPubliclyListed, type ArticleListOpts } from '../../src/lib/db/repos/articles.ts';
import type { Article } from '../../src/types/news';

const art = (patch: Partial<Article>): Article =>
  ({
    id: 'x',
    title: 't',
    titleKiny: 't',
    excerpt: 'e',
    excerptKiny: 'e',
    category: 'amahanga',
    status: 'developing',
    sources: [],
    publishedAt: new Date(Date.now() - 3600_000).toISOString(),
    fetchedAt: new Date().toISOString(),
    entities: [],
    keyPointsKiny: [],
    keyPointsEn: [],
    tags: [],
    views: 0,
    isMock: false,
    ...patch,
  }) as Article;

describe('category registry (client-safe)', () => {
  it('covers every documented section exactly once', () => {
    assert.equal(new Set(CATEGORY_SLUGS).size, CATEGORY_SLUGS.length);
    assert.equal(CATEGORY_SLUGS.length, 10);
    for (const meta of CATEGORY_META) assert.ok(isCategorySlug(meta.slug));
    assert.ok(CATEGORY_META.every((m) => m.labels.rw && m.labels.en && m.labels.fr && m.labels.sw));
    assert.ok(CATEGORY_META.every((m) => !('ar' in m.labels) && !('ha' in m.labels)), 'Rwanda locales only');
    assert.ok(CATEGORY_META.every((m) => /^#[0-9a-f]{6}$/i.test(m.color)));
    assert.equal(isCategorySlug('gossip'), false);
  });
});

describe('publish states decide what the public sees', () => {
  it('hides drafts and archived, shows published', () => {
    assert.equal(isPubliclyListed(art({ publishState: 'draft' })), false);
    assert.equal(isPubliclyListed(art({ publishState: 'archived' })), false);
    assert.equal(isPubliclyListed(art({ publishState: 'published' })), true);
    assert.equal(isPubliclyListed(art({})), true, 'feed rows default to published');
  });

  it('scheduled stories appear only when due', () => {
    assert.equal(isPubliclyListed(art({ publishState: 'scheduled', publishedAt: new Date(Date.now() + 3600_000).toISOString() })), false);
    assert.equal(isPubliclyListed(art({ publishState: 'scheduled', publishedAt: new Date(Date.now() - 1000).toISOString() })), true);
  });

  it('unlisted stories never appear in listings', () => {
    assert.equal(isPubliclyListed(art({ visibility: 'unlisted' })), false);
  });

  it('exposes the filter names the console uses', () => {
    const opts: ArticleListOpts = { q: 'ibiciro', hasVideo: true, featured: true, publishState: 'draft', includeUnpublished: true };
    assert.equal(opts.publishState, 'draft');
    assert.equal(opts.hasVideo, true);
  });
});
