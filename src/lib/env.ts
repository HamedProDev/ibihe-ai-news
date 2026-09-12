/**
 * Minimal .env loader for plain `node` entrypoints (workers, db:migrate).
 *
 * Next.js loads .env.local automatically for the web server, but raw `node`
 * scripts do NOT — without this, DATABASE_URL/CRON_SECRET are invisible to
 * workers even when .env.local exists. Entrypoints import this module first.
 *
 * Precedence: real environment > .env.local > .env. Missing files are fine.
 * Values are taken literally (no inline-comment stripping) so passwords and
 * URLs containing `#` survive intact.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return null;
  const idx = trimmed.indexOf('=');
  const key = trimmed.slice(0, idx).trim();
  let value = trimmed.slice(idx + 1).trim();
  // Strip matching surrounding quotes (dotenv convention).
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    value = value.slice(1, -1);
  }
  if (!key || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null;
  return [key, value];
}

export function loadLocalEnv(cwd: string = process.cwd()): void {
  for (const file of ['.env.local', '.env']) {
    const full = path.join(cwd, file);
    if (!existsSync(full)) continue;
    let text: string;
    try {
      text = readFileSync(full, 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split('\n')) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      const [key, value] = parsed;
      // Never override the real environment (CI / production).
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

// Side effect on import: entrypoints do `import '../../src/lib/env.ts';`
loadLocalEnv();
