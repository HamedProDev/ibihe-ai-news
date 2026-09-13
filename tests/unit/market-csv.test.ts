import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { observationId, parseMarketCsv, splitCsvLine } from '../../src/lib/market/sources/csv.ts';

const HEADER = 'commodity,price,unit,market,district,observed_at,source_name,source_url';

describe('splitCsvLine', () => {
  it('handles quotes and escaped quotes', () => {
    assert.deepEqual(splitCsvLine('a,"b,c","d""e",f'), ['a', 'b,c', 'd"e', 'f']);
  });
});

describe('parseMarketCsv', () => {
  const now = new Date('2026-09-10T12:00:00Z');

  it('parses valid rows into real (non-mock) observations', () => {
    const { rows, errors } = parseMarketCsv(
      `${HEADER}\nibirayi,500,kg,Kimironko,Gasabo,2026-09-09,Ibihe field team,https://example.com/r1`,
      undefined,
      now,
    );
    assert.equal(errors.length, 0);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.commodity, 'ibirayi');
    assert.equal(rows[0]?.pricePerKg, 500);
    assert.equal(rows[0]?.isMock, false);
    assert.equal(rows[0]?.source.name, 'Ibihe field team');
  });

  it('accepts commodity aliases and converts local units', () => {
    const { rows } = parseMarketCsv(
      `${HEADER}\npotatoes,45000,sack 100kg,Kimironko,Gasabo,2026-09-09,Team,https://example.com/r`,
      undefined,
      now,
    );
    assert.equal(rows[0]?.commodity, 'ibirayi');
    assert.equal(rows[0]?.pricePerKg, 450);
  });

  it('keeps unknown units with pricePerKg=null instead of guessing', () => {
    const { rows, errors } = parseMarketCsv(
      `${HEADER}\nibirayi,500,mystery,Kimironko,Gasabo,2026-09-09,Team,https://example.com/r`,
      undefined,
      now,
    );
    assert.equal(errors.length, 0);
    assert.equal(rows[0]?.pricePerKg, null);
  });

  it('rejects bad rows individually with clear errors', () => {
    const { rows, errors } = parseMarketCsv(
      `${HEADER}
spaceships,500,kg,Kimironko,Gasabo,2026-09-09,Team,https://example.com/r
ibirayi,-5,kg,Kimironko,Gasabo,2026-09-09,Team,https://example.com/r
ibirayi,500,kg,Kimironko,Gasabo,2026-09-20,Team,https://example.com/r
ibirayi,500,kg,Kimironko,Gasabo,2026-09-09,Team,not-a-url
ibirayi,600,kg,Kimironko,Gasabo,2026-09-09,Team,https://example.com/ok`,
      undefined,
      now,
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.price, 600);
    assert.equal(errors.length, 4);
    assert.ok(errors.some((e) => e.message.includes('Unknown commodity')));
    assert.ok(errors.some((e) => e.message.includes('Invalid price')));
    assert.ok(errors.some((e) => e.message.includes('future')));
    assert.ok(errors.some((e) => e.message.includes('source_url')));
  });

  it('rejects files with missing columns or empty bodies', () => {
    const bad = parseMarketCsv('commodity,price\nibirayi,500', undefined, now);
    assert.equal(bad.rows.length, 0);
    assert.ok(bad.errors[0]?.message.includes('Missing required columns'));
    const empty = parseMarketCsv('', undefined, now);
    assert.equal(empty.rows.length, 0);
  });

  it('ignores comments and blank lines', () => {
    const { rows } = parseMarketCsv(
      `# comment\n${HEADER}\n\nibirayi,500,kg,Kimironko,Gasabo,2026-09-09,Team,https://example.com/r\n`,
      undefined,
      now,
    );
    assert.equal(rows.length, 1);
  });
});

describe('observationId', () => {
  it('is deterministic for the same inputs', () => {
    const parts = { commodity: 'ibirayi', market: 'Kimironko', observedAt: '2026-09-09T00:00:00.000Z', price: 500, unit: 'kg' };
    assert.equal(observationId(parts), observationId(parts));
    assert.notEqual(observationId(parts), observationId({ ...parts, price: 501 }));
  });
});
