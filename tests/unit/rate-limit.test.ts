import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../../src/lib/api/rate-limit.ts';

describe('createRateLimiter', () => {
  it('allows up to the limit then blocks within the window', () => {
    const rl = createRateLimiter();
    const opts = { limit: 3, windowMs: 1000 };
    assert.equal(rl.check('k', opts, 0).allowed, true);
    assert.equal(rl.check('k', opts, 100).allowed, true);
    assert.equal(rl.check('k', opts, 200).allowed, true);
    const blocked = rl.check('k', opts, 300);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfterMs > 0);
  });

  it('refills after the window passes', () => {
    const rl = createRateLimiter();
    const opts = { limit: 1, windowMs: 1000 };
    assert.equal(rl.check('k', opts, 0).allowed, true);
    assert.equal(rl.check('k', opts, 500).allowed, false);
    assert.equal(rl.check('k', opts, 1001).allowed, true);
  });

  it('isolates keys', () => {
    const rl = createRateLimiter();
    const opts = { limit: 1, windowMs: 60_000 };
    assert.equal(rl.check('a', opts, 0).allowed, true);
    assert.equal(rl.check('b', opts, 0).allowed, true);
    assert.equal(rl.check('a', opts, 0).allowed, false);
  });

  it('reports remaining counts', () => {
    const rl = createRateLimiter();
    assert.equal(rl.check('k', { limit: 2, windowMs: 1000 }, 0).remaining, 1);
    assert.equal(rl.check('k', { limit: 2, windowMs: 1000 }, 10).remaining, 0);
  });
});
