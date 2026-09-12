import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createManusTask,
  extractAssistantText,
  getManusTask,
  ManusError,
  runManusTask,
} from '../../src/lib/ai/manus.ts';

const realFetch = globalThis.fetch;
const realKey = process.env.MANUS_API_KEY;

afterEach(() => {
  globalThis.fetch = realFetch;
  if (realKey === undefined) delete process.env.MANUS_API_KEY;
  else process.env.MANUS_API_KEY = realKey;
});

function mockFetch(handler: (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => unknown) {
  globalThis.fetch = (async (url: unknown, init?: {
    method?: string; headers?: Record<string, string>; body?: string;
  }) => ({
    status: 200,
    json: async () => handler(String(url), init),
  })) as typeof fetch;
}

describe('manus client', () => {
  it('throws not-configured without a key', async () => {
    delete process.env.MANUS_API_KEY;
    await assert.rejects(() => createManusTask('hi'), (e: unknown) => e instanceof ManusError && e.code === 'not-configured');
  });

  it('sends x-manus-api-key and reads task id defensively', async () => {
    process.env.MANUS_API_KEY = 'test-key';
    let seenKey = '';
    let seenBody: unknown = null;
    mockFetch((url, init) => {
      seenKey = init?.headers?.['x-manus-api-key'] ?? '';
      seenBody = init?.body ? JSON.parse(init.body) : null;
      assert.ok(url.endsWith('/v2/task.create'));
      return { ok: true, request_id: 'r1', task: { id: 'task-22chars00000000001' } };
    });
    const { taskId } = await createManusTask('Summarize this', 'rw');
    assert.equal(taskId, 'task-22chars00000000001');
    assert.equal(seenKey, 'test-key');
    assert.deepEqual((seenBody as { message: { content: string } }).message, { content: 'Summarize this' });
  });

  it('surfaces Manus envelope errors as ManusError', async () => {
    process.env.MANUS_API_KEY = 'bad-key';
    mockFetch(() => ({ ok: false, request_id: 'r2', error: { code: 'permission_denied', message: 'Invalid key' } }));
    await assert.rejects(() => getManusTask('t1'), (e: unknown) => e instanceof ManusError && e.code === 'permission_denied');
  });

  it('runManusTask polls until stopped then reads output', async () => {
    process.env.MANUS_API_KEY = 'test-key';
    let polls = 0;
    mockFetch((url) => {
      if (url.includes('/v2/task.create')) return { ok: true, request_id: 'r', task_id: 'task-abc' };
      if (url.includes('/v2/task.detail')) {
        polls++;
        return { ok: true, request_id: 'r', task: { id: 'task-abc', status: polls < 2 ? 'running' : 'stopped' } };
      }
      if (url.includes('/v2/task.listMessages')) {
        return {
          ok: true, request_id: 'r', task_id: 'task-abc',
          messages: [
            { type: 'user_message', content: 'Summarize this' },
            { type: 'assistant_message', content: 'Here is the summary.' },
          ],
        };
      }
      throw new Error(`unexpected ${url}`);
    });
    const result = await runManusTask('Summarize this', { pollMs: 1000, timeoutMs: 10_000 });
    assert.equal(result.taskId, 'task-abc');
    assert.equal(result.status, 'stopped');
    assert.equal(result.output, 'Here is the summary.');
    assert.equal(result.messageCount, 2);
    assert.equal(polls, 2);
  });

  it('returns timeout status instead of hanging forever', async () => {
    process.env.MANUS_API_KEY = 'test-key';
    mockFetch((url) => {
      if (url.includes('/v2/task.create')) return { ok: true, request_id: 'r', task_id: 'task-abc' };
      if (url.includes('/v2/task.detail')) return { ok: true, request_id: 'r', task: { id: 'task-abc', status: 'running' } };
      return { ok: true, request_id: 'r', task_id: 'task-abc', messages: [] };
    });
    const result = await runManusTask('x'.repeat(10), { pollMs: 1000, timeoutMs: 50 });
    assert.equal(result.status, 'timeout');
  });
});

describe('extractAssistantText', () => {
  it('collects assistant text across event shapes, skips the rest', () => {
    const out = extractAssistantText([
      { type: 'status_update', status: 'running' },
      { type: 'user_message', content: 'question' },
      { type: 'assistant_message', content: 'First part.' },
      { type: 'assistant_message', parts: [{ text: 'Second' }, { text: 'part.' }] },
      { event_type: 'assistant_message', message: { content: 'Third.' } },
      { type: 'error_message', content: 'boom' },
      'garbage',
      null,
    ]);
    assert.equal(out, 'First part.\n\nSecond\n\npart.\n\nThird.');
  });

  it('returns empty string when nothing matches', () => {
    assert.equal(extractAssistantText([]), '');
    assert.equal(extractAssistantText([{ type: 'user_message', content: 'hi' }]), '');
  });
});
