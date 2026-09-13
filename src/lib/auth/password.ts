/**
 * Password hashing (server-only) — scrypt with per-password salt.
 * Stored format: `scrypt$<n>$<r>$<p>$<salt-hex>$<hash-hex>`.
 */
import { scrypt as scryptCb, randomBytes, timingSafeEqual } from 'node:crypto';

if (typeof window !== 'undefined') {
  throw new Error('[auth] password imported in browser — server-only');
}

/** Manual promisify: @types/node's overload picks the 3-arg signature. */
function scryptBuf(password: string, salt: string, keylen: number, opts: { N: number; r: number; p: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, opts, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
}

// OWASP-ish interactive parameters (~80ms on modest hardware).
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptBuf(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, salt, hashHex] = parts as [string, string, string, string, string, string];
  const expected = Buffer.from(hashHex, 'hex');
  if (expected.length !== KEYLEN) return false;
  let derived: Buffer;
  try {
    derived = await scryptBuf(password, salt, KEYLEN, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
  } catch {
    return false;
  }
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (password.length > 200) return 'Password is too long.';
  return null;
}

export function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string' || email.length > 254) return 'Invalid email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Invalid email address.';
  return null;
}
