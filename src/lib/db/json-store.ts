/**
 * Tiny server-side JSON persistence layer.
 *
 * Used for ingestion caches and forecast records until Postgres/Supabase is
 * configured. Files live in `.data/` (gitignored). Writes are atomic
 * (tmp + rename) and history is append-only where it matters.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), '.data');

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(name: string): string {
  const safe = name.replace(/[^a-z0-9-_]/gi, '_');
  return path.join(DATA_DIR, `${safe}.json`);
}

export interface StoredEnvelope<T> {
  updatedAt: string;
  value: T;
}

export async function readStore<T>(name: string): Promise<StoredEnvelope<T> | null> {
  try {
    const raw = await fs.readFile(filePath(name), 'utf8');
    return JSON.parse(raw) as StoredEnvelope<T>;
  } catch {
    return null;
  }
}

export async function writeStore<T>(name: string, value: T): Promise<void> {
  await ensureDir();
  const envelope: StoredEnvelope<T> = { updatedAt: new Date().toISOString(), value };
  const tmp = filePath(name) + `.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(envelope, null, 1), 'utf8');
  await fs.rename(tmp, filePath(name));
}

/** Age of a stored envelope in milliseconds (Infinity when missing). */
export function storeAgeMs<T>(envelope: StoredEnvelope<T> | null): number {
  if (!envelope) return Number.POSITIVE_INFINITY;
  return Date.now() - new Date(envelope.updatedAt).getTime();
}
