/**
 * Tiny fetch wrapper for the console: unwraps the { ok, data, error } envelope,
 * throws ApiError so pages can show a retry state, and always sends cookies.
 */
import { ApiError } from './api';

export type Json = Record<string, unknown>;

export async function adminGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', ...init });
  const json = (await res.json().catch(() => null)) as {
    ok: boolean;
    data?: T;
    error?: { code: string; messageKiny: string; messageEn: string };
  } | null;
  if (!res.ok || !json?.ok || json.data === undefined) {
    throw new ApiError(json?.error?.code ?? `http-${res.status}`, json?.error?.messageKiny ?? '', json?.error?.messageEn ?? 'Request failed');
  }
  return json.data;
}

export async function adminSend<T>(path: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  if (body instanceof FormData) {
    const res = await fetch(path, { method, body, credentials: 'same-origin' });
    const json = (await res.json().catch(() => null)) as { ok: boolean; data?: T; error?: { code: string; messageKiny: string; messageEn: string } } | null;
    if (!res.ok || !json?.ok || json.data === undefined) {
      throw new ApiError(json?.error?.code ?? `http-${res.status}`, json?.error?.messageKiny ?? '', json?.error?.messageEn ?? 'Request failed');
    }
    return json.data;
  }
  return adminGet<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

