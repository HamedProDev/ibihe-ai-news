import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { entityKey, extractEntities } from '../../src/lib/news/entities.ts';

describe('extractEntities', () => {
  it('finds districts with Kinyarwanda locatives', () => {
    const ents = extractEntities('Imvura nyinshi i Musanze', 'Abahinzi bo mu Musanze barishimye. I Nyagatare hari izuba.');
    const districts = ents.filter((e) => e.type === 'district').map((e) => e.normalized);
    assert.ok(districts.includes('Musanze'));
    assert.ok(districts.includes('Nyagatare'));
  });

  it('finds commodities and markets', () => {
    const ents = extractEntities('Ibirayi byamanutse ku Kimironko', 'Ibiciro by’ibishyimbo byazamutse i Nyabugogo.');
    const commodities = ents.filter((e) => e.type === 'commodity').map((e) => e.normalized);
    assert.ok(commodities.includes('Ibirayi'));
    assert.ok(commodities.includes('Ibishyimbo'));
    const markets = ents.filter((e) => e.type === 'market');
    assert.ok(markets.length >= 1);
  });

  it('finds known institutions', () => {
    const ents = extractEntities('RAB yatangaje umusaruro', 'BNR ivuga ko ifaranga rigumye.');
    const orgs = ents.filter((e) => e.type === 'organization').map((e) => e.normalized);
    assert.ok(orgs.includes('RAB'));
    assert.ok(orgs.includes('BNR'));
  });

  it('parses Kinyarwanda, English and ISO dates', () => {
    const ents = extractEntities('Inama', 'Izaba ku wa 12 Mutarama 2026. Deadline 15 January 2026. Ref 2026-02-01.');
    const dates = ents.filter((e) => e.type === 'date').map((e) => e.normalized);
    assert.ok(dates.includes('2026-01-12'));
    assert.ok(dates.includes('2026-01-15'));
    assert.ok(dates.includes('2026-02-01'));
  });

  it('anchors relative dates to the given now', () => {
    const now = new Date('2026-09-10T12:00:00Z');
    const ents = extractEntities('Ejo hashize hazagwa imvura', '', now);
    const dates = ents.filter((e) => e.type === 'date').map((e) => e.normalized);
    assert.ok(dates.includes('2026-09-11'));
  });

  it('is conservative with people (honorific + 2 names required)', () => {
    const withTitle = extractEntities('Minisitiri Jean Bosco yavuze', '');
    assert.ok(withTitle.some((e) => e.type === 'person'));
    const bare = extractEntities('Jean yagiye i Kigali', '');
    assert.ok(!bare.some((e) => e.type === 'person'));
  });

  it('never returns duplicate keys', () => {
    const ents = extractEntities('Musanze Musanze i Musanze', 'Musanze');
    const keys = ents.map(entityKey);
    assert.equal(new Set(keys).size, keys.length);
  });
});
