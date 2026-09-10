/**
 * Market source adapter registry (server-only).
 *
 * Each adapter pulls REAL observations from a configured upstream and
 * returns validated rows. Adapters are enabled via environment:
 *
 *   ESOKO_FEED_URL=https://.../prices.csv   (CSV in the canonical format)
 *   MARKET_SOURCES=esoko                    (comma list; default: esoko)
 *
 * Unknown/unreachable upstreams yield errors, never fabricated rows.
 * Until a real upstream is configured, the platform serves clearly-labeled
 * demo data and the admin CSV import (POST /api/market/import).
 */
import type { MarketObservation } from '../../../types/market';
import { parseMarketCsv } from './csv.ts';

export interface AdapterResult {
  adapterId: string;
  rows: MarketObservation[];
  errors: string[];
}

export interface MarketSourceAdapter {
  id: string;
  name: string;
  enabled(): boolean;
  fetch(): Promise<AdapterResult>;
}

async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'IbiheNewsBot/1.0 (+https://ibihe.rw)', Accept: 'text/csv,text/plain,*/*' },
    });
    if (!res.ok) throw new Error(`http-${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** e-Soko style CSV feed (URL configured by the operator). */
export const esokoAdapter: MarketSourceAdapter = {
  id: 'esoko',
  name: 'e-Soko CSV feed',
  enabled(): boolean {
    return Boolean(process.env.ESOKO_FEED_URL);
  },
  async fetch(): Promise<AdapterResult> {
    const url = process.env.ESOKO_FEED_URL as string;
    try {
      const text = await fetchText(url, 12_000);
      const parsed = parseMarketCsv(text);
      return {
        adapterId: this.id,
        rows: parsed.rows,
        errors: parsed.errors.map((e) => `row ${e.row}: ${e.message}`),
      };
    } catch (err) {
      return { adapterId: this.id, rows: [], errors: [`fetch failed: ${err instanceof Error ? err.message : err}`] };
    }
  },
};

/**
 * RAB market-data adapter — DOCUMENTED STUB. RAB publishes market bulletins,
 * but there is no stable public machine-readable endpoint verified for
 * automated ingestion, so this adapter stays disabled rather than scraping
 * blindly. Enable by implementing fetch() against a verified RAB source and
 * setting RAB_FEED_URL.
 */
export const rabAdapter: MarketSourceAdapter = {
  id: 'rab',
  name: 'RAB market bulletins (stub)',
  enabled(): boolean {
    return false; // intentionally disabled until a verified endpoint exists
  },
  async fetch(): Promise<AdapterResult> {
    return { adapterId: this.id, rows: [], errors: ['RAB adapter is not configured (no verified machine-readable endpoint).'] };
  },
};

const ALL: MarketSourceAdapter[] = [esokoAdapter, rabAdapter];

export function enabledAdapters(): MarketSourceAdapter[] {
  const allow = (process.env.MARKET_SOURCES ?? 'esoko')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return ALL.filter((a) => a.enabled() && allow.includes(a.id));
}

export interface PullResult {
  rows: MarketObservation[];
  errors: string[];
  adapters: string[];
}

/** Pull all enabled adapters (failures are collected, never thrown). */
export async function pullMarketSources(): Promise<PullResult> {
  const adapters = enabledAdapters();
  const rows: MarketObservation[] = [];
  const errors: string[] = [];
  for (const a of adapters) {
    try {
      const r = await a.fetch();
      rows.push(...r.rows);
      errors.push(...r.errors.map((e) => `${a.id}: ${e}`));
    } catch (err) {
      errors.push(`${a.id}: ${err instanceof Error ? err.message : err}`);
    }
  }
  return { rows, errors, adapters: adapters.map((a) => a.id) };
}
