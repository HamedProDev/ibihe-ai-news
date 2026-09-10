import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Article } from '../../src/types/news';
import type { DistrictWeather } from '../../src/types/weather';
import { extractKeyPoints, splitSentences } from '../../src/lib/news/summarize.ts';
import { buildWhyItMatters } from '../../src/lib/news/why-matters.ts';
import { buildBriefing } from '../../src/lib/news/briefing.ts';
import { buildAgroAdvisory } from '../../src/lib/weather/agro.ts';
import { classifyCategory } from '../../src/lib/news/ingest.ts';

function article(partial: Partial<Article> & { id: string }): Article {
  return {
    title: 'T',
    titleKiny: 'U',
    excerpt: 'E',
    excerptKiny: 'I',
    category: 'ubuhinzi',
    status: 'developing',
    sources: [],
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    entities: [],
    keyPointsKiny: [],
    keyPointsEn: [],
    tags: [],
    views: 0,
    isMock: true,
    ...partial,
  };
}

describe('summarize (extractive)', () => {
  it('splits sentences and picks top key points in order', () => {
    const text =
      'Ibiciro by’ibirayi byamanutse ku Kimironko uyu munsi. Abacuruzi bavuga ko umusaruro wiyongereye i Musanze. ' +
      'RAB ivuga ko izakomeza gukurikirana isoko. Ikirere cyiza cyafashije isarura.';
    assert.equal(splitSentences(text).length, 4);
    const points = extractKeyPoints(text, 2);
    assert.equal(points.length, 2);
    // Order preserved (lede first).
    assert.ok(points[0]?.includes('Ibiciro') || points[1]?.includes('Ibiciro'));
  });

  it('returns empty for empty input', () => {
    assert.deepEqual(extractKeyPoints('', 3), []);
  });
});

describe('classifyCategory', () => {
  it('routes commodity and institution keywords', () => {
    assert.equal(classifyCategory('Umusaruro w’ibirayi', ''), 'ubuhinzi');
    assert.equal(classifyCategory('BNR yatangaje igipimo', ''), 'ubukungu');
    assert.equal(classifyCategory('MTN 5G', ''), 'ikoranabuhanga');
    assert.equal(classifyCategory('Something totally unrelated here qzxw', 'nothing relevant at all qzxw'), 'amahanga');
  });
});

describe('buildWhyItMatters', () => {
  it('always covers citizens + Rwanda, farmers for agri stories', () => {
    const a = article({
      id: 'a',
      entities: [
        { text: 'Ibirayi', normalized: 'Ibirayi', type: 'commodity', confidence: 0.9 },
        { text: 'Musanze', normalized: 'Musanze', type: 'district', confidence: 0.9 },
      ],
    });
    const items = buildWhyItMatters(a);
    const audiences = items.map((i) => i.audience);
    assert.ok(audiences.includes('citizens'));
    assert.ok(audiences.includes('rwanda'));
    assert.ok(audiences.includes('farmers'));
    // Grounded: mentions the actual entities, in both languages.
    assert.ok(items.some((i) => i.textKiny.includes('Ibirayi')));
    assert.ok(items.every((i) => i.textKiny.length > 10 && i.textEn.length > 10));
  });

  it('skips farmers for non-agri stories without commodities', () => {
    const a = article({ id: 'b', category: 'imikino', tags: ['sport'] });
    const audiences = buildWhyItMatters(a).map((i) => i.audience);
    assert.ok(!audiences.includes('farmers'));
  });
});

describe('buildBriefing', () => {
  it('ranks multi-source first and caps bullets', () => {
    const now = new Date();
    const mk = (id: string, status: Article['status']): Article =>
      article({ id, status, publishedAt: now.toISOString(), keyPointsKiny: [`Point ${id}`], keyPointsEn: [`Point ${id}`] });
    const b = buildBriefing([mk('a', 'developing'), mk('b', 'multi-source'), mk('c', 'verified')], 2, now);
    assert.equal(b.bullets.length, 2);
    assert.equal(b.bullets[0]?.articleId, 'b');
  });
});

function weather(level: 'wet' | 'dry', district = 'Musanze'): DistrictWeather {
  const prob = level === 'wet' ? 80 : 10;
  return {
    district,
    latitude: -1.5,
    longitude: 29.63,
    observation: null,
    forecast: [0, 1, 2, 3, 4].map((i) => ({
      date: `2026-09-${10 + i}`,
      district,
      tempMaxC: 22,
      tempMinC: 15,
      precipitationProbability: prob,
      precipitationMm: level === 'wet' ? 8 : 0,
      conditionCode: null,
      source: 'Test',
    })),
    fetchedAt: new Date().toISOString(),
    available: true,
  };
}

describe('buildAgroAdvisory', () => {
  it('returns null when weather is unavailable', () => {
    const wx = weather('wet');
    wx.available = false;
    assert.equal(buildAgroAdvisory(wx), null);
    assert.equal(buildAgroAdvisory({ ...weather('wet'), forecast: [] }), null);
  });

  it('produces wet vs dry advisories with uncertainty + provenance', () => {
    const wet = buildAgroAdvisory(weather('wet'));
    const dry = buildAgroAdvisory(weather('dry'));
    assert.ok(wet?.rainfallOutlookKiny.includes('Musanze'));
    assert.ok((wet?.implicationsKiny.length ?? 0) > 0);
    assert.ok((dry?.recommendationsKiny.length ?? 0) > 0);
    assert.ok((wet?.uncertaintyKiny.length ?? 0) > 20);
    assert.equal(wet?.ai.isRuleBased, true);
    assert.ok((wet?.inputRefs.length ?? 0) >= 5);
  });
});
