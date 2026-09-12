import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { categoryChip } from '../../src/lib/news/category-style.ts';
import { dayKey } from '../../src/lib/briefing/worker.ts';
import type { NewsCategory } from '../../src/types/news.ts';

describe('category-style', () => {
  it('returns a chip class for every category', () => {
    const cats: NewsCategory[] = [
      'ubuhinzi', 'politiki', 'ubukungu', 'ikoranabuhanga', 'ubuzima', 'imikino',
      'uburezi', 'umuco', 'ibidukikije', 'amahanga', 'imvurugano',
    ];
    for (const c of cats) {
      assert.ok(categoryChip(c).includes('bg-'), c);
    }
  });
});

describe('briefing worker', () => {
  it('dayKey formats UTC days', () => {
    assert.equal(dayKey(new Date('2026-09-12T23:30:00+02:00')), '2026-09-12');
    assert.match(dayKey(), /^\d{4}-\d{2}-\d{2}$/);
  });
});
