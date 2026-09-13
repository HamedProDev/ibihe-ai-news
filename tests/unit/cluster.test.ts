import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Article } from '../../src/types/news';
import { clusterArticles, relatedArticles } from '../../src/lib/news/cluster.ts';

function article(partial: Partial<Article> & { id: string }): Article {
  return {
    title: partial.title ?? 'Title',
    titleKiny: partial.titleKiny ?? 'Umutwe',
    excerpt: '',
    excerptKiny: '',
    category: partial.category ?? 'rwanda',
    status: 'developing',
    sources: [],
    publishedAt: partial.publishedAt ?? '2026-09-10T10:00:00.000Z',
    fetchedAt: '2026-09-10T11:00:00.000Z',
    entities: partial.entities ?? [],
    keyPointsKiny: [],
    keyPointsEn: [],
    tags: [],
    views: 0,
    isMock: true,
    ...partial,
  };
}

describe('clusterArticles', () => {
  it('groups same-event articles sharing entities + category', () => {
    const ents = [
      { text: 'Musanze', normalized: 'Musanze', type: 'district' as const, confidence: 0.9 },
      { text: 'Ibirayi', normalized: 'Ibirayi', type: 'commodity' as const, confidence: 0.9 },
    ];
    const clusters = clusterArticles([
      article({ id: 'a1', titleKiny: 'Umusaruro w’ibirayi wiyongereye i Musanze', entities: ents }),
      article({ id: 'a2', titleKiny: 'Umusaruro w’ibirayi wiyongereye mu Musanze', entities: ents, publishedAt: '2026-09-10T12:00:00.000Z' }),
      article({ id: 'b1', titleKiny: 'MTN itangiye 5G i Kigali', category: 'ikoranabuhanga' }),
    ]);
    assert.equal(clusters.length, 1);
    assert.deepEqual(new Set(clusters[0]?.articleIds), new Set(['a1', 'a2']));
    assert.equal(clusters[0]?.timeline.length, 2);
  });

  it('ignores singletons', () => {
    const clusters = clusterArticles([
      article({ id: 'a', titleKiny: 'Inkuru imwe rukumbi' }),
      article({ id: 'b', titleKiny: 'Indi nkuru itandukanye cyane hano', category: 'ubukungu' }),
    ]);
    assert.equal(clusters.length, 0);
  });
});

describe('relatedArticles', () => {
  it('ranks shared-entity articles first and excludes self', () => {
    const base = article({
      id: 'base',
      entities: [{ text: 'Musanze', normalized: 'Musanze', type: 'district', confidence: 0.9 }],
    });
    const sameEntity = article({
      id: 'same',
      category: 'ubukungu',
      entities: [{ text: 'Musanze', normalized: 'Musanze', type: 'district', confidence: 0.9 }],
    });
    const sameCat = article({ id: 'cat' });
    const unrelated = article({ id: 'other', category: 'imikino' });
    const rel = relatedArticles(base, [base, sameEntity, sameCat, unrelated]);
    assert.ok(!rel.some((a) => a.id === 'base'));
    assert.equal(rel[0]?.id, 'same');
    assert.ok(rel.some((a) => a.id === 'cat'));
    assert.ok(!rel.some((a) => a.id === 'other'));
  });
});
