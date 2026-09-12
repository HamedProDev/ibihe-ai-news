import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOCALES, LOCALE_META, STRINGS, isLocale, tx, type LangEntry } from '../../src/lib/i18n/dictionaries.ts';
import { INTL_LOCALE, longDate, timeAgo } from '../../src/lib/i18n/timeago.ts';

describe('dictionaries', () => {
  it('exposes exactly six locales with metadata', () => {
    assert.deepEqual([...LOCALES], ['rw', 'en', 'fr', 'sw', 'ar', 'ha']);
    assert.equal(LOCALE_META.length, 6);
    assert.equal(LOCALE_META.find((m) => m.code === 'ar')?.dir, 'rtl');
    assert.ok(LOCALE_META.every((m) => m.dir === 'ltr' || m.code === 'ar'));
  });

  it('isLocale accepts only known locales', () => {
    assert.equal(isLocale('rw'), true);
    assert.equal(isLocale('ha'), true);
    assert.equal(isLocale('xx'), false);
    assert.equal(isLocale(undefined), false);
  });

  it('tx translates with en->rw fallback', () => {
    const e = STRINGS.nav.home;
    assert.equal(tx('rw', e), e.rw);
    assert.equal(tx('fr', e), e.fr);
    const partial = { rw: 'RW', en: 'EN', fr: '', sw: '', ar: '', ha: '' } as unknown as LangEntry;
    assert.equal(tx('sw', partial), 'EN');
    const rwOnly = { rw: 'RW', en: '', fr: '', sw: '', ar: '', ha: '' } as unknown as LangEntry;
    assert.equal(tx('ar', rwOnly), 'RW');
  });

  it('every LangEntry has all six languages', () => {
    const missing: string[] = [];
    const walk = (obj: unknown, path: string) => {
      if (!obj || typeof obj !== 'object') return;
      const rec = obj as Record<string, unknown>;
      if (typeof rec.rw === 'string' && typeof rec.en === 'string') {
        for (const l of LOCALES) {
          if (typeof rec[l] !== 'string' || (rec[l] as string).length === 0) missing.push(`${path}.${l}`);
        }
        return;
      }
      for (const [k, v] of Object.entries(rec)) walk(v, path ? `${path}.${k}` : k);
    };
    walk(STRINGS, '');
    assert.deepEqual(missing, []);
  });
});

describe('timeago', () => {
  it('maps every locale to an intl tag', () => {
    assert.deepEqual(Object.keys(INTL_LOCALE).sort(), [...LOCALES].sort());
  });

  it('formats relative time per locale', () => {
    const now = Date.parse('2026-09-12T12:00:00Z');
    const hour = new Date(now - 3600_000).toISOString();
    assert.equal(timeAgo(hour, 'en', now), '1 hour ago');
    assert.ok(timeAgo(hour, 'fr', now).length > 0);
    assert.ok(timeAgo(hour, 'rw', now).length > 0);
    assert.equal(timeAgo('not-a-date', 'en', now), '');
  });

  it('formats long dates', () => {
    const d = longDate('2026-09-12T12:00:00Z', 'en');
    assert.ok(d.includes('2026'));
    assert.equal(longDate('junk', 'en'), '');
  });
});
