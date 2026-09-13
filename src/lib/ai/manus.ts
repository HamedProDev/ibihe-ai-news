/**
 * Manus AI agent client (server-only).
 *
 * Manus is task-based, not chat-completions: create a task, poll until it
 * stops, then read the assistant messages. Docs: https://open.manus.ai/docs
 *
 * Key: MANUS_API_KEY (manus.im/app → Settings → Integrations → API).
 * Header: `x-manus-api-key`. Base: https://api.manus.ai
 */
import type { AIGeneration } from '../../types/provenance';

if (typeof window !== 'undefined') {
  throw new Error('[ai] manus imported in browser — server-only');
}

export const MANUS_API_BASE = 'https://api.manus.ai';
export const MANUS_MODEL = 'manus-default-agent';

export function isManusConfigured(): boolean {
  return Boolean(process.env.MANUS_API_KEY);
}

export class ManusError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ManusError';
    this.code = code;
  }
}

export type ManusStatus = 'running' | 'stopped' | 'waiting' | 'error' | 'timeout';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
}

async function manusRequest(
  path: string,
  opts: { method?: 'GET' | 'POST'; query?: Record<string, string>; body?: unknown } = {},
): Promise<Record<string, unknown>> {
  const key = process.env.MANUS_API_KEY;
  if (!key) throw new ManusError('not-configured', 'MANUS_API_KEY is not set.');
  const url = new URL(`${MANUS_API_BASE}${path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) url.searchParams.set(k, v);
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? 'GET',
      headers: {
        'x-manus-api-key': key,
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    throw new ManusError('network', `Manus request failed: ${e instanceof Error ? e.message : 'network error'}`);
  }
  const json: unknown = await res.json().catch(() => null);
  if (!isRecord(json)) {
    throw new ManusError('bad-response', `Manus returned HTTP ${res.status} with a non-JSON body.`);
  }
  if (json.ok !== true) {
    const errObj = isRecord(json.error) ? json.error : {};
    throw new ManusError(
      str(errObj.code) ?? `http-${res.status}`,
      str(errObj.message) ?? `Manus request failed (HTTP ${res.status}).`,
    );
  }
  return json;
}

/** task_id appears as task.id / task_id / id depending on the endpoint. */
function extractTaskId(json: Record<string, unknown>): string | undefined {
  const direct = str(json.task_id) ?? str(json.id);
  if (direct) return direct;
  if (isRecord(json.task)) return str(json.task.id);
  return undefined;
}

export async function createManusTask(prompt: string, locale = 'en'): Promise<{ taskId: string }> {
  const json = await manusRequest('/v2/task.create', {
    method: 'POST',
    body: { message: { content: prompt }, locale, interactive_mode: false },
  });
  const taskId = extractTaskId(json);
  if (!taskId) throw new ManusError('bad-response', 'Manus task.create returned no task id.');
  return { taskId };
}

const TERMINAL = new Set(['stopped', 'error', 'waiting']);

export async function getManusTask(taskId: string): Promise<{ id: string; status: string }> {
  const json = await manusRequest('/v2/task.detail', { query: { task_id: taskId } });
  const task = isRecord(json.task) ? json.task : {};
  return { id: str(task.id) ?? taskId, status: str(task.status) ?? 'running' };
}

export async function listManusMessages(taskId: string, limit = 50): Promise<unknown[]> {
  const json = await manusRequest('/v2/task.listMessages', {
    query: { task_id: taskId, order: 'asc', limit: String(Math.min(200, Math.max(1, limit))) },
  });
  return Array.isArray(json.messages) ? json.messages : [];
}

function textFromParts(parts: unknown): string[] {
  if (!Array.isArray(parts)) return [];
  const out: string[] = [];
  for (const p of parts) {
    if (typeof p === 'string' && p.trim()) out.push(p);
    else if (isRecord(p)) {
      const t = str(p.text) ?? str(p.output_text) ?? (isRecord(p.text) ? str(p.text.value) : undefined);
      if (t) out.push(t);
    }
  }
  return out;
}

/**
 * Pull assistant reply text out of task events. Shapes vary by event
 * version, so this walks the known containers defensively.
 */
export function extractAssistantText(messages: unknown[]): string {
  const chunks: string[] = [];
  for (const m of messages) {
    if (!isRecord(m)) continue;
    const type = str(m.type) ?? str(m.event_type) ?? '';
    if (type && !['assistant_message', 'assistant'].includes(type)) continue;
    const direct =
      str(m.content) ?? str(m.text) ?? str(m.output_text) ?? (isRecord(m.message) ? str(m.message.content) : undefined);
    if (direct) {
      chunks.push(direct);
      continue;
    }
    const container = isRecord(m.message) ? (m.message.content ?? m.message.parts) : (m.parts ?? m.contents);
    chunks.push(...textFromParts(typeof container === 'string' ? [container] : container));
  }
  return chunks.join('\n\n').slice(0, 20000);
}

export interface ManusRunResult {
  taskId: string;
  status: ManusStatus;
  /** Assistant reply text (may be partial on waiting/timeout). */
  output: string;
  messageCount: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * One-shot helper: create → poll → read output. Never throws for task-level
 * outcomes (waiting/error/timeout come back as status); throws ManusError
 * only for transport/config failures.
 */
export async function runManusTask(
  prompt: string,
  opts: { timeoutMs?: number; pollMs?: number; locale?: string } = {},
): Promise<ManusRunResult> {
  const timeoutMs = opts.timeoutMs ?? 105_000;
  const pollMs = Math.max(1000, opts.pollMs ?? 3000);
  const { taskId } = await createManusTask(prompt, opts.locale ?? 'en');
  const started = Date.now();
  let status = 'running';
  for (;;) {
    const detail = await getManusTask(taskId).catch(() => null);
    status = detail?.status ?? 'running';
    if (TERMINAL.has(status) || Date.now() - started > timeoutMs) break;
    await sleep(pollMs);
  }
  const finalStatus: ManusStatus =
    status === 'stopped' || status === 'error' || status === 'waiting'
      ? status
      : 'timeout';
  const messages = await listManusMessages(taskId).catch(() => []);
  return {
    taskId,
    status: finalStatus,
    output: extractAssistantText(messages),
    messageCount: messages.length,
  };
}

/** Provenance stamp for Manus-produced content (review queue compatible). */
export function manusProvenance(taskId: string): AIGeneration {
  return {
    inputIds: [taskId],
    model: MANUS_MODEL,
    promptVersion: 'manus-task-v1',
    generatedAt: new Date().toISOString(),
    reviewStatus: 'unreviewed',
  };
}
