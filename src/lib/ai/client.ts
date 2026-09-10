/**
 * Server-only AI client.
 *
 * - Provider keys NEVER leave the server (no NEXT_PUBLIC_* AI keys).
 * - All prompts are versioned (PROMPT_VERSIONS) for provenance.
 * - LLM JSON outputs are validated before use — never blind JSON.parse.
 *
 * IMPORTANT: this module must only be imported from server code
 * (API routes, workers, server components). It throws if accidentally
 * bundled for the browser.
 */
import Anthropic from '@anthropic-ai/sdk';

if (typeof window !== 'undefined') {
  throw new Error('[ai] client imported in browser — AI calls are server-only');
}

export const AI_MODEL = 'claude-sonnet-4-20250514';

export const PROMPT_VERSIONS = {
  summarizeRw: 'summarize-rw-1.1',
  translateRw: 'translate-rw-1.0',
  askGrounded: 'ask-grounded-1.1',
} as const;

let cached: Anthropic | null = null;

export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function aiClient(): Anthropic | null {
  if (!isAIConfigured()) return null;
  if (!cached) cached = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return cached;
}

export interface ChatOpts {
  maxTokens?: number;
  system?: string;
}

/** Minimal validated text completion. Returns null on any failure. */
export async function complete(prompt: string, opts: ChatOpts = {}): Promise<string | null> {
  const client = aiClient();
  if (!client) return null;
  try {
    const res = await client.messages.create({
      model: AI_MODEL,
      max_tokens: opts.maxTokens ?? 600,
      system: opts.system,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = res.content[0];
    if (!block || block.type !== 'text') return null;
    const text = block.text.trim();
    return text.length > 0 ? text : null;
  } catch (err) {
    console.error('[ai] completion failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Extract a JSON object from an LLM response (tolerates code fences). */
export function extractJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1));
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

export interface SummaryResult {
  summaryEn: string;
  summaryKiny: string;
}

/** Validated bilingual summary output. */
export function parseSummary(obj: Record<string, unknown>): SummaryResult | null {
  const summary = str(obj.summary) ?? str(obj.summaryEn);
  const summaryKiny = str(obj.summaryKiny);
  if (!summary || !summaryKiny) return null;
  return { summaryEn: summary.slice(0, 800), summaryKiny: summaryKiny.slice(0, 800) };
}

export async function summarizeBilingual(title: string, content: string): Promise<SummaryResult | null> {
  const text = await complete(
    `Summarize this news article in 2 sentences in English, then translate that summary to Kinyarwanda.\n\nTitle: ${title.slice(0, 300)}\nContent: ${content.slice(0, 2000)}\n\nRespond ONLY with JSON (no markdown):\n{"summary": "English summary", "summaryKiny": "Kinyarwanda summary"}`,
    { maxTokens: 400 },
  );
  if (!text) return null;
  const obj = extractJsonObject(text);
  return obj ? parseSummary(obj) : null;
}

export async function translateToKinyarwanda(text: string): Promise<string | null> {
  if (!text.trim()) return null;
  return complete(`Translate the following text to Kinyarwanda. Return ONLY the translation, nothing else:\n\n${text.slice(0, 1500)}`, {
    maxTokens: 400,
  });
}
