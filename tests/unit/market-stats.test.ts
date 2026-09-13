import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { MarketObservation } from '../../src/types/market';
import { buildTrend, directionOf, latestByCommodity, movingAverage, percentChange } from '../../src/lib/market/stats.ts';
import { findCommodity, toPricePerKg } from '../../src/lib/market/commodities.ts';

function obs(partial: Partial<MarketObservation> & { id: string }): MarketObservation {
  const at = partial.observedAt ?? '2026-09-10T10:00:00.000Z';
  return {
    commodity: 'ibirayi',
    price: 500,
    currency: 'RWF',
    unit: 'kg',
    pricePerKg: 500,
    market: 'Kimironko',
    district: 'Gasabo',
    source: { name: 'Test', url: 'https://example.com', fetchedAt: at },
    observedAt: at,
    fetchedAt: at,
    isMock: true,
    ...partial,
  };
}

describe('movingAverage / percentChange / directionOf', () => {
  it('computes windowed averages and nulls on short series', () => {
    assert.equal(movingAverage([1, 2, 3, 4], 2), 3.5);
    assert.equal(movingAverage([1], 2), null);
  });

  it('computes percent change and guards divide-by-zero', () => {
    assert.equal(percentChange(100, 110), 10);
    assert.equal(percentChange(0, 10), null);
    assert.equal(percentChange(null, 10), null);
  });

  it('applies the flat band', () => {
    assert.equal(directionOf(5), 'up');
    assert.equal(directionOf(-5), 'down');
    assert.equal(directionOf(0.5), 'flat');
    assert.equal(directionOf(null), 'unknown');
  });
});

describe('toPricePerKg', () => {
  it('converts known local units', () => {
    assert.equal(toPricePerKg('ibirayi', 500, 'kg'), 500);
    assert.equal(toPricePerKg('ibirayi', 45000, 'sack 100kg'), 450);
  });

  it('returns null for unknown units instead of guessing', () => {
    assert.equal(toPricePerKg('ibirayi', 500, 'mystery-unit'), null);
  });
});

describe('findCommodity', () => {
  it('resolves Kinyarwanda and English aliases', () => {
    assert.equal(findCommodity('ibirayi'), 'ibirayi');
    assert.equal(findCommodity('Potatoes'), 'ibirayi');
    assert.equal(findCommodity('cassava'), 'imyumbati');
    assert.equal(findCommodity('spaceships'), undefined);
  });
});

describe('buildTrend', () => {
  it('detects rising trends and reports dataMode', () => {
    const rows = [400, 420, 440, 460, 480, 500].map((p, i) =>
      obs({ id: `o${i}`, price: p, pricePerKg: p, observedAt: `2026-09-0${i + 1}T10:00:00.000Z` }),
    );
    const trend = buildTrend('ibirayi', rows, { windowDays: 30, now: new Date('2026-09-10T12:00:00Z') });
    assert.equal(trend.direction, 'up');
    assert.ok((trend.changePercent ?? 0) > 0);
    assert.equal(trend.observations, 6);
    assert.equal(trend.dataMode, 'demo');
    assert.equal(trend.series.length, 6);
  });

  it('handles empty input honestly', () => {
    const trend = buildTrend('ibirayi', [], { windowDays: 30 });
    assert.equal(trend.direction, 'unknown');
    assert.equal(trend.latestPricePerKg, null);
    assert.equal(trend.observations, 0);
  });

  it('respects market/district scope', () => {
    const rows = [
      obs({ id: 'a', market: 'Kimironko', price: 500, pricePerKg: 500 }),
      obs({ id: 'b', market: 'Nyabugogo', price: 1000, pricePerKg: 1000 }),
    ];
    const trend = buildTrend('ibirayi', rows, { market: 'Nyabugogo' });
    assert.equal(trend.observations, 1);
    assert.equal(trend.latestPricePerKg, 1000);
  });
});

describe('latestByCommodity', () => {
  it('picks the newest observation per commodity', () => {
    const rows = [
      obs({ id: 'old', commodity: 'ibirayi', price: 400, pricePerKg: 400, observedAt: '2026-09-01T10:00:00.000Z' }),
      obs({ id: 'new', commodity: 'ibirayi', price: 500, pricePerKg: 500, observedAt: '2026-09-09T10:00:00.000Z' }),
      obs({ id: 'bean', commodity: 'ibishyimbo', price: 800, pricePerKg: 800 }),
    ];
    const latest = latestByCommodity(rows);
    assert.equal(latest.get('ibirayi')?.id, 'new');
    assert.equal(latest.get('ibishyimbo')?.id, 'bean');
  });
});
