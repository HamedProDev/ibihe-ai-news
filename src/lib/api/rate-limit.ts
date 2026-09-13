/**
 * Tiny in-memory sliding-window rate limiter.
 *
 * Good enough for a single instance; for multi-instance production put a
 * Redis/Upstash counter behind the same interface (see runbook).
 */

export interface RateLimitOpts {
  limit: number;
  windowMs: number;
}

export interface RateLimitVerdict {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function createRateLimiter() {
  const hits = new Map<string, number[]>();

  function check(key: string, opts: RateLimitOpts, now = Date.now()): RateLimitVerdict {
    const { limit, windowMs } = opts;
    const arr = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
    if (arr.length >= limit) {
      const oldest = arr[0] ?? now;
      return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, oldest + windowMs - now) };
    }
    arr.push(now);
    hits.set(key, arr);
    // Opportunistic cleanup to bound memory.
    if (hits.size > 10_000) {
      for (const [k, v] of hits) {
        if (v.length === 0 || (v[v.length - 1] ?? 0) < now - windowMs) hits.delete(k);
      }
    }
    return { allowed: true, remaining: limit - arr.length, retryAfterMs: 0 };
  }

  function reset(): void {
    hits.clear();
  }

  return { check, reset };
}

/** Process-wide limiter used by API routes. */
export const globalLimiter = createRateLimiter();

export function clientKey(req: Request, route: string): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return `${route}:${ip}`;
}
