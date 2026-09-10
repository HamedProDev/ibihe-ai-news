import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { MarketObservation } from '../../src/types/market';
import type { Forecast } from '../../src/types/forecasting';
import {
  BASELINE_MODEL_VERSION,
  buildTrackRecord,
  computeSignals,
  evaluateDirection,
  generateForecast,
  PROB_CAP,
  PROB_FLOOR,
} from '../../src/lib/forecasting/engine.ts';

function obs(id: string, price: number, day: string): MarketObservation {
  const at = `${day}T10:00:00.000Z`;
  return {
    id,
    commodity: 'ibirayi',
    price,
    currency: 'RWF',
    unit: 'kg',
    pricePerKg: price,
    market: 'Kimironko',
    district: 'Gasabo',
    source: { name: 'Test', url: 'https://example.com', fetchedAt: at },
    observedAt: at,
    fetchedAt: at,
    isMock: true,
  };
}

function risingSeries(): MarketObservation[] {
  return [400, 410, 420, 430, 440, 450, 460, 470, 480, 490].map((p, i) =>
    obs(`r${i}`, p, `2026-08-${String(i + 1).padStart(2, '0')}`),
  );
}

describe('computeSignals', () => {
  it('detects positive momentum on rising prices', () => {
    const s = computeSignals(risingSeries(), 'ibirayi', new Date('2026-09-10T12:00:00Z'));
    assert.ok(s.momentum > 0);
    assert.equal(s.baselinePricePerKg, 490);
    assert.equal(s.momentumN, 10);
  });
});

describe('generateForecast', () => {
  const now = new Date('2026-09-10T12:00:00Z');

  it('refuses when data is insufficient', () => {
    assert.equal(generateForecast({ commodity: 'ibirayi', horizon: '14d' }, [], now), null);
    assert.equal(generateForecast({ commodity: 'ibirayi', horizon: '14d' }, risingSeries().slice(0, 3), now), null);
  });

  it('produces a transparent, bounded forecast', () => {
    const fc = generateForecast({ commodity: 'ibirayi', horizon: '14d' }, risingSeries(), now, 't1');
    assert.ok(fc);
    assert.equal(fc?.modelVersion, BASELINE_MODEL_VERSION);
    assert.ok((fc?.probability ?? 0) >= PROB_FLOOR && (fc?.probability ?? 0) <= PROB_CAP);
    assert.ok((fc?.confidence ?? 0) >= 40 && (fc?.confidence ?? 0) <= 95);
    assert.ok((fc?.evidenceKiny.length ?? 0) >= 2);
    assert.ok((fc?.assumptionsKiny.length ?? 0) >= 2);
    assert.ok((fc?.invalidatorsKiny.length ?? 0) >= 2);
    assert.ok(fc?.questionKiny.includes('Ibirayi'));
    assert.ok(fc?.predictedRangePerKg && fc.predictedRangePerKg.low < fc.predictedRangePerKg.high);
    assert.equal(fc?.evaluation, 'pending');
    assert.equal(fc?.resolvesAt.slice(0, 10), '2026-09-24');
  });

  it('widens ranges for longer horizons', () => {
    const short = generateForecast({ commodity: 'ibirayi', horizon: '7d' }, risingSeries(), now, 's');
    const long = generateForecast({ commodity: 'ibirayi', horizon: '30d' }, risingSeries(), now, 'l');
    const wShort = (short?.predictedRangePerKg?.high ?? 0) - (short?.predictedRangePerKg?.low ?? 0);
    const wLong = (long?.predictedRangePerKg?.high ?? 0) - (long?.predictedRangePerKg?.low ?? 0);
    assert.ok(wLong > wShort);
  });
});

describe('evaluateDirection', () => {
  it('scores direction with a flat band', () => {
    assert.equal(evaluateDirection('up', 100, 110).status, 'correct');
    assert.equal(evaluateDirection('up', 100, 90).status, 'incorrect');
    assert.equal(evaluateDirection('flat', 100, 101).actual, 'flat');
    assert.equal(evaluateDirection('flat', 100, 101).status, 'correct');
  });
});

function forecast(partial: Partial<Forecast> & { id: string }): Forecast {
  return {
    questionKiny: 'Q',
    questionEn: 'Q',
    commodity: 'ibirayi',
    horizon: '14d',
    resolvesAt: '2026-09-24T12:00:00.000Z',
    direction: 'up',
    probability: 65,
    confidence: 60,
    evidenceKiny: [],
    evidenceEn: [],
    assumptionsKiny: [],
    assumptionsEn: [],
    invalidatorsKiny: [],
    invalidatorsEn: [],
    modelVersion: BASELINE_MODEL_VERSION,
    createdAt: '2026-09-10T12:00:00.000Z',
    evaluation: 'pending',
    isMock: true,
    ...partial,
  };
}

describe('buildTrackRecord', () => {
  it('aggregates accuracy by commodity, horizon and version + calibration', () => {
    const record = buildTrackRecord([
      forecast({ id: 'f1', evaluation: 'correct', probability: 65 }),
      forecast({ id: 'f2', evaluation: 'incorrect', probability: 75, horizon: '7d' }),
      forecast({ id: 'f3', evaluation: 'pending', probability: 65 }),
    ]);
    assert.equal(record.totalForecasts, 3);
    assert.equal(record.evaluated, 2);
    assert.equal(record.pending, 1);
    assert.equal(record.accuracy, 50);
    assert.equal(record.byHorizon.length, 2);
    const bin60 = record.calibration.find((c) => c.bin === '60–70%');
    assert.equal(bin60?.count, 1);
    assert.equal(bin60?.observed, 100);
    const bin70 = record.calibration.find((c) => c.bin === '70–80%');
    assert.equal(bin70?.observed, 0);
  });

  it('returns nulls when nothing is evaluated yet', () => {
    const record = buildTrackRecord([forecast({ id: 'f1' })]);
    assert.equal(record.accuracy, null);
    assert.equal(record.evaluated, 0);
  });
});
