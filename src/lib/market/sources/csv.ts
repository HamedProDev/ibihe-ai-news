/**
 * Market CSV parsing + strict validation (pure, tested).
 *
 * Canonical import format (header row required):
 *   commodity,price,unit,market,district,observed_at,source_name,source_url
 *   ibirayi,500,kg,Kimironko,Gasabo,2026-09-10,Ibihe field team,https://example.com/report
 *
 * Rules:
 * - commodity must be in the registry (Kinyarwanda id or alias).
 * - price must be a positive number.
 * - observed_at must be a valid date, not in the future.
 * - source_url must be a real http(s) URL (provenance is mandatory).
 * - unknown units are KEPT with pricePerKg=null (never guessed).
 * - invalid rows are rejected with row-level errors; valid rows still import.
 */
import { createHash } from 'node:crypto';
import type { MarketObservation } from '../../../types/market';
import { COMMODITIES, findCommodity } from '../commodities.ts';
import { toPricePerKg } from '../commodities.ts';

export interface CsvParseError {
  row: number;
  message: string;
}

export interface CsvParseResult {
  rows: MarketObservation[];
  errors: CsvParseError[];
}

/** Minimal RFC-4180-ish CSV line splitter (quotes + escaped quotes). */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

const REQUIRED = ['commodity', 'price', 'unit', 'market', 'district', 'observed_at', 'source_name', 'source_url'];

function isHttpUrl(u: string): boolean {
  try {
    const p = new URL(u);
    return p.protocol === 'http:' || p.protocol === 'https:';
  } catch {
    return false;
  }
}

export function observationId(parts: { commodity: string; market: string; observedAt: string; price: number; unit: string }): string {
  const raw = `${parts.commodity}|${parts.market}|${parts.observedAt}|${parts.price}|${parts.unit}`;
  return `m-${createHash('sha256').update(raw.toLowerCase()).digest('hex').slice(0, 16)}`;
}

export function parseMarketCsv(text: string, fetchedAt?: string, now = new Date()): CsvParseResult {
  const rows: MarketObservation[] = [];
  const errors: CsvParseError[] = [];
  const fetched = fetchedAt ?? now.toISOString();

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('#'));
  if (lines.length === 0) return { rows, errors: [{ row: 0, message: 'Empty CSV: no rows found.' }] };

  const header = splitCsvLine(lines[0] ?? '').map((h) => h.toLowerCase());
  const missing = REQUIRED.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return { rows, errors: [{ row: 1, message: `Missing required columns: ${missing.join(', ')}.` }] };
  }
  const idx = (c: string): number => header.indexOf(c);

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i] ?? '');
    const rowNum = i + 1;
    const get = (c: string): string => (cols[idx(c)] ?? '').trim();

    const commodityRaw = get('commodity');
    const commodity = findCommodity(commodityRaw);
    if (!commodity) {
      errors.push({ row: rowNum, message: `Unknown commodity "${commodityRaw}". Valid: ${Object.keys(COMMODITIES).join(', ')}.` });
      continue;
    }
    const price = Number(get('price').replace(/[\s,]/g, ''));
    if (!Number.isFinite(price) || price <= 0) {
      errors.push({ row: rowNum, message: `Invalid price "${get('price')}" (must be a positive number).` });
      continue;
    }
    const unit = get('unit');
    if (!unit) {
      errors.push({ row: rowNum, message: 'Missing unit.' });
      continue;
    }
    const market = get('market');
    const district = get('district');
    if (!market || !district) {
      errors.push({ row: rowNum, message: 'Market and district are required.' });
      continue;
    }
    const observed = new Date(get('observed_at'));
    if (Number.isNaN(observed.getTime())) {
      errors.push({ row: rowNum, message: `Invalid observed_at "${get('observed_at')}".` });
      continue;
    }
    if (observed.getTime() > now.getTime() + 24 * 3600_000) {
      errors.push({ row: rowNum, message: 'observed_at cannot be in the future.' });
      continue;
    }
    const sourceName = get('source_name');
    const sourceUrl = get('source_url');
    if (!sourceName || !isHttpUrl(sourceUrl)) {
      errors.push({ row: rowNum, message: 'A valid source_name and http(s) source_url are required.' });
      continue;
    }

    const observedAt = observed.toISOString();
    rows.push({
      id: observationId({ commodity, market, observedAt, price, unit }),
      commodity,
      price,
      currency: 'RWF',
      unit,
      pricePerKg: toPricePerKg(commodity, price, unit),
      market,
      district,
      source: { name: sourceName, url: sourceUrl, publishedAt: observedAt, fetchedAt: fetched, language: 'rw' },
      observedAt,
      fetchedAt: fetched,
      isMock: false,
    });
  }
  return { rows, errors };
}
