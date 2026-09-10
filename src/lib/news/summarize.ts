/**
 * Extractive summarization fallback (no LLM required).
 *
 * Scores sentences by keyword density + position and returns the top N.
 * Used when no AI provider key is configured; outputs are labeled as
 * rule-based ("ibihe-extractive-0.1") wherever shown.
 */
import type { AIGeneration } from '../../types/provenance';

export const EXTRACTIVE_VERSION = 'ibihe-extractive-0.1';

const STOP = new Set([
  'mu', 'ku', 'na', 'ya', 'rya', 'wa', 'za', 'ka', 'muri', 'kuri', 'ni', 'nta', 'ko', 'ngo',
  'kandi', 'ariko', 'the', 'a', 'an', 'of', 'in', 'on', 'to', 'for', 'and', 'or', 'is', 'are', 'this',
]);

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Þ0-9"“])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function cleanWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function wordFreq(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const w of cleanWords(text)) freq.set(w, (freq.get(w) ?? 0) + 1);
  return freq;
}

/** Pick the top `maxPoints` sentences as key points. Deterministic. */
export function extractKeyPoints(text: string, maxPoints = 4): string[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];
  const freq = wordFreq(text);
  const scored = sentences.map((s, i) => {
    const words = cleanWords(s);
    const density = words.length === 0 ? 0 : words.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0) / words.length;
    // News lede carries the key fact: prefer early sentences + medium length.
    const position = 1 - i / (sentences.length + 1);
    const ledeBonus = i === 0 ? 1.2 : 1;
    const lengthPenalty = s.length > 220 ? 0.7 : 1;
    return { s, score: density * (0.5 + 0.5 * position) * ledeBonus * lengthPenalty, i };
  });
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, Math.min(maxPoints, sentences.length)).sort((a, b) => a.i - b.i);
  return picked.map((p) => p.s);
}

export function extractiveProvenance(inputIds: string[]): AIGeneration {
  return {
    inputIds,
    model: EXTRACTIVE_VERSION,
    promptVersion: 'keypoints-v1',
    generatedAt: new Date().toISOString(),
    reviewStatus: 'unreviewed',
    isRuleBased: true,
  };
}
