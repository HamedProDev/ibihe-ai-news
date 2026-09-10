import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Article } from '../../src/types/news';
import type { ReviewItem } from '../../src/lib/review/types.ts';
import { applyReviewToArticle, decodeValue, encodeValue } from '../../src/lib/review/apply.ts';

function article(): Article {
  return {
    id: 'a1',
    title: 'Title',
    titleKiny: 'Title',
    excerpt: 'Excerpt',
    excerptKiny: 'Excerpt',
    category: 'ubuhinzi',
    status: 'developing',
    sources: [],
    publishedAt: '2026-09-10T10:00:00.000Z',
    fetchedAt: '2026-09-10T11:00:00.000Z',
    entities: [],
    keyPointsKiny: [],
    keyPointsEn: ['Point one', 'Point two'],
    generated: {
      inputIds: ['a1'],
      model: 'ibihe-extractive-0.1',
      promptVersion: 'keypoints-v1',
      generatedAt: '2026-09-10T11:00:00.000Z',
      reviewStatus: 'unreviewed',
      isRuleBased: true,
    },
    tags: [],
    views: 0,
    isMock: false,
  };
}

function item(field: ReviewItem['field'], proposedRw: string): ReviewItem {
  return {
    id: 'rev-1',
    kind: 'article-ai-field',
    refId: 'a1',
    field,
    status: 'pending',
    proposedRw,
    proposedEn: '',
    currentRw: '',
    currentEn: '',
    context: {},
    ai: {
      inputIds: ['a1'],
      model: 'test',
      promptVersion: 'v1',
      generatedAt: '2026-09-10T12:00:00.000Z',
      reviewStatus: 'unreviewed',
    },
    decidedBy: '',
    decidedAt: null,
    decisionNote: '',
    createdAt: '2026-09-10T12:00:00.000Z',
  };
}

describe('encode/decode values', () => {
  it('round-trips key-point arrays as JSON', () => {
    const enc = encodeValue('keyPointsKiny', ['a', 'b']);
    assert.deepEqual(decodeValue('keyPointsKiny', enc), ['a', 'b']);
  });

  it('falls back to line-splitting for non-JSON key points', () => {
    assert.deepEqual(decodeValue('keyPointsKiny', 'a\nb\n'), ['a', 'b']);
  });

  it('passes plain strings through for title/excerpt', () => {
    assert.equal(decodeValue('titleKiny', 'Umutwe'), 'Umutwe');
  });
});

describe('applyReviewToArticle', () => {
  it('approve copies the proposal and marks provenance reviewed', () => {
    const next = applyReviewToArticle(
      article(),
      item('keyPointsKiny', JSON.stringify(['Ingingo ya mbere'])),
      { decision: 'approve' },
    );
    assert.deepEqual(next.keyPointsKiny, ['Ingingo ya mbere']);
    assert.equal(next.generated?.reviewStatus, 'reviewed');
  });

  it('edit uses the human text instead of the proposal', () => {
    const next = applyReviewToArticle(article(), item('titleKiny', 'PROPOSAL'), {
      decision: 'edit',
      editedRaw: 'Umutwe wagenzuwe',
    });
    assert.equal(next.titleKiny, 'Umutwe wagenzuwe');
    assert.equal(next.generated?.reviewStatus, 'reviewed');
  });

  it('flag leaves the article untouched', () => {
    const before = article();
    const next = applyReviewToArticle(before, item('titleKiny', 'PROPOSAL'), { decision: 'flag' });
    assert.equal(next, before);
  });

  it('caps key points at 6 and truncates long titles', () => {
    const next = applyReviewToArticle(
      article(),
      item('keyPointsKiny', JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8'])),
      { decision: 'approve' },
    );
    assert.equal(next.keyPointsKiny.length, 6);
  });
});
