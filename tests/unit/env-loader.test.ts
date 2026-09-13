import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadLocalEnv, parseEnvLine } from '../../src/lib/env.ts';

const TOUCHED = ['IBIHE_TEST_A', 'IBIHE_TEST_B', 'IBIHE_TEST_C'];
afterEach(() => {
  for (const k of TOUCHED) delete process.env[k];
});

describe('parseEnvLine', () => {
  it('parses KEY=VALUE and skips blanks/comments/garbage', () => {
    assert.deepEqual(parseEnvLine('A=1'), ['A', '1']);
    assert.deepEqual(parseEnvLine('  B = hello world  '), ['B', 'hello world']);
    assert.equal(parseEnvLine(''), null);
    assert.equal(parseEnvLine('# comment'), null);
    assert.equal(parseEnvLine('no-equals-here'), null);
    assert.equal(parseEnvLine('9BAD=x'), null);
  });

  it('keeps values literal: first = splits, # and quotes handled', () => {
    // Passwords/URLs with # or = must survive intact.
    assert.deepEqual(parseEnvLine('U=postgresql://u:p#1@h:5432/db?x=a=b'), [
      'U',
      'postgresql://u:p#1@h:5432/db?x=a=b',
    ]);
    assert.deepEqual(parseEnvLine('Q="quoted value"'), ['Q', 'quoted value']);
    assert.deepEqual(parseEnvLine("Q='single'"), ['Q', 'single']);
    assert.deepEqual(parseEnvLine('E='), ['E', '']);
  });
});

describe('loadLocalEnv', () => {
  it('loads .env.local with precedence over .env, never overriding real env', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ibihe-env-'));
    try {
      writeFileSync(path.join(dir, '.env'), 'IBIHE_TEST_A=from-dotenv\nIBIHE_TEST_B=from-dotenv\n');
      writeFileSync(path.join(dir, '.env.local'), 'IBIHE_TEST_B=from-local\nIBIHE_TEST_C=only-local\n');
      process.env.IBIHE_TEST_A = 'from-process';
      loadLocalEnv(dir);
      assert.equal(process.env.IBIHE_TEST_A, 'from-process'); // real env wins
      assert.equal(process.env.IBIHE_TEST_B, 'from-local'); // .env.local wins over .env
      assert.equal(process.env.IBIHE_TEST_C, 'only-local');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does nothing when no env files exist', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ibihe-env-empty-'));
    try {
      loadLocalEnv(dir); // must not throw
      assert.equal(process.env.IBIHE_TEST_A, undefined);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
