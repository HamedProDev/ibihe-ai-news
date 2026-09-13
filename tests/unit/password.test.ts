import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, validateEmail, validatePassword, verifyPassword } from '../../src/lib/auth/password.ts';

describe('password hashing (scrypt)', () => {
  it('hashes and verifies round-trip', async () => {
    const hash = await hashPassword('correct-horse-123');
    assert.ok(hash.startsWith('scrypt$'));
    assert.equal(await verifyPassword('correct-horse-123', hash), true);
    assert.equal(await verifyPassword('wrong-password', hash), false);
  });

  it('uses a unique salt per hash', async () => {
    const a = await hashPassword('same-password-1');
    const b = await hashPassword('same-password-1');
    assert.notEqual(a, b);
    assert.equal(await verifyPassword('same-password-1', a), true);
    assert.equal(await verifyPassword('same-password-1', b), true);
  });

  it('rejects malformed stored hashes', async () => {
    assert.equal(await verifyPassword('x', ''), false);
    assert.equal(await verifyPassword('x', 'not-a-hash'), false);
    assert.equal(await verifyPassword('x', 'scrypt$1$2$3$zz'), false);
  });
});

describe('credential validation', () => {
  it('enforces minimum password length', () => {
    assert.equal(validatePassword('short'), 'Password must be at least 8 characters.');
    assert.equal(validatePassword(''), 'Password must be at least 8 characters.');
    assert.equal(validatePassword(123 as unknown as string), 'Password must be at least 8 characters.');
    assert.equal(validatePassword('long-enough-1'), null);
  });

  it('validates email shape', () => {
    assert.equal(validateEmail('not-an-email'), 'Invalid email address.');
    assert.equal(validateEmail('a@b'), 'Invalid email address.');
    assert.equal(validateEmail(''), 'Invalid email address.');
    assert.equal(validateEmail('user@example.co'), null);
  });
});
