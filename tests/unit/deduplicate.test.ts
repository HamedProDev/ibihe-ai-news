import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  contentHash,
  dayBucket,
  findDuplicates,
  jaccard,
  normalizeTitle,
  titleTokens,
} from '../../src/lib/news/deduplicate.ts';

describe('normalizeTitle', () => {
  it('strips site suffixes, punctuation and case', () => {
    assert.equal(normalizeTitle('Ibirayi bizagwa 5% | The New Times'), 'ibirayi bizagwa 5');
    assert.equal(normalizeTitle('  AMERICA—Politiki!!! '), 'america politiki');
  });

  it('removes stopwords from tokens', () => {
    const toks = titleTokens('Ibiciro by’ibirayi mu isoko rya Kimironko');
    assert.ok(toks.includes('ibiciro'));
    assert.ok(toks.includes('ibirayi'));
    assert.ok(!toks.includes('mu'));
    assert.ok(!toks.includes('rya'));
  });
});

describe('jaccard', () => {
  it('returns 1 for identical sets and 0 for disjoint', () => {
    assert.equal(jaccard(['a', 'b'], ['a', 'b']), 1);
    assert.equal(jaccard(['a'], ['b']), 0);
    assert.equal(jaccard([], ['b']), 0);
  });
});

describe('contentHash / dayBucket', () => {
  it('is stable for the same input', () => {
    assert.equal(contentHash('Hello', '2026-01-01'), contentHash('Hello', '2026-01-01'));
    // Punctuation is normalized away by design; different words hash differently.
    assert.equal(contentHash('Hello', '2026-01-01'), contentHash('Hello!', '2026-01-01'));
    assert.notEqual(contentHash('Hello', '2026-01-01'), contentHash('Hello there', '2026-01-01'));
  });

  it('buckets invalid dates as unknown', () => {
    assert.equal(dayBucket('not-a-date'), 'unknown');
    assert.equal(dayBucket('2026-09-10T10:00:00Z'), '2026-09-10');
  });
});

describe('findDuplicates', () => {
  const base = '2026-09-10T10:00:00.000Z';
  it('groups near-identical titles and picks the earliest as canonical', () => {
    const groups = findDuplicates([
      { id: 'a', title: 'Ibirayi bizagwa 5% mu masoko ya Kigali', publishedAt: base },
      { id: 'b', title: 'Ibirayi bizagwa 5% mu masoko ya Kigali | Igihe', publishedAt: '2026-09-10T12:00:00.000Z' },
      { id: 'c', title: 'MTN itangiye 5G i Kigali', publishedAt: base },
    ]);
    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.canonicalId, 'a');
    assert.deepEqual(groups[0]?.duplicateIds, ['b']);
  });

  it('does not group items outside the time window', () => {
    const groups = findDuplicates(
      [
        { id: 'a', title: 'Imvura nyinshi i Musanze', publishedAt: '2026-09-01T10:00:00.000Z' },
        { id: 'b', title: 'Imvura nyinshi i Musanze', publishedAt: '2026-09-10T10:00:00.000Z' },
      ],
      { windowHours: 72 },
    );
    assert.equal(groups.length, 0);
  });

  it('does not group unrelated stories', () => {
    const groups = findDuplicates([
      { id: 'a', title: 'Abahinzi ba Nyagatare bishimira umusaruro', publishedAt: base },
      { id: 'b', title: 'Inama y’ubuzima iteraniye i Kigali', publishedAt: base },
    ]);
    assert.equal(groups.length, 0);
  });
});
