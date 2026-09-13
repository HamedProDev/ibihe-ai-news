import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Article } from '../../src/types/news';
import { searchArticles, tokenizeQuery } from '../../src/lib/news/search.ts';

function article(partial: Partial<Article> & { id: string }): Article {
  return {
    title: partial.title ?? '',
    titleKiny: partial.titleKiny ?? '',
    excerpt: partial.excerpt ?? '',
    excerptKiny: partial.excerptKiny ?? '',
    category: 'rwanda',
    status: 'developing',
    sources: [],
    publishedAt: '2026-09-10T10:00:00.000Z',
    fetchedAt: '2026-09-10T11:00:00.000Z',
    entities: partial.entities ?? [],
    keyPointsKiny: [],
    keyPointsEn: [],
    tags: partial.tags ?? [],
    views: 0,
    isMock: true,
    ...partial,
  };
}

describe('tokenizeQuery', () => {
  it('drops Kinyarwanda stopwords', () => {
    assert.deepEqual(tokenizeQuery('ibiciro by’ibirayi mu isoko'), ['ibiciro', 'ibirayi', 'isoko']);
  });
});

describe('searchArticles', () => {
  const pool = [
    article({ id: 'p', titleKiny: 'Ibiciro by’ibirayi byamanutse', tags: ['ibirayi'] }),
    article({ id: 'b', titleKiny: 'Ibishyimbo byazamutse i Nyagatare', tags: ['ibishyimbo'] }),
    article({ id: 'm', titleKiny: 'MTN itangiye 5G', category: 'ikoranabuhanga' }),
  ];

  it('finds Kinyarwanda matches and ranks title hits first', () => {
    const hits = searchArticles(pool, 'ibirayi');
    assert.equal(hits[0]?.article.id, 'p');
    assert.ok((hits[0]?.score ?? 0) > 0);
  });

  it('matches entities and tags', () => {
    const withEnt = article({
      id: 'e',
      titleKiny: 'Inkuru y’isoko',
      entities: [{ text: 'Musanze', normalized: 'Musanze', type: 'district', confidence: 0.9 }],
    });
    const hits = searchArticles([...pool, withEnt], 'Musanze');
    assert.equal(hits[0]?.article.id, 'e');
  });

  it('returns empty for stopword-only queries', () => {
    assert.deepEqual(searchArticles(pool, 'mu na ya'), []);
  });

  it('tolerates prefixes', () => {
    const hits = searchArticles(pool, 'ibiray');
    assert.ok(hits.some((h) => h.article.id === 'p'));
  });
});
