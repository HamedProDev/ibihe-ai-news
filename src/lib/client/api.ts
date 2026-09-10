/**
 * Typed browser API client. Understands the { ok, data, dataMode } envelope
 * plus legacy top-level fields during migration.
 */
import type { ApiErr, ApiOk } from '@/types/api';
import type { DataMode } from '@/types/provenance';

export class ApiError extends Error {
  code: string;
  messageKiny: string;
  constructor(code: string, messageKiny: string, messageEn: string) {
    super(messageEn);
    this.code = code;
    this.messageKiny = messageKiny;
  }
}

function isEnvelope(json: unknown): json is ApiOk<unknown> | ApiErr {
  return typeof json === 'object' && json !== null && 'ok' in json;
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<{ data: T; dataMode: DataMode; raw: unknown }> {
  const res = await fetch(path, init);
  const json: unknown = await res.json().catch(() => null);
  if (!isEnvelope(json)) {
    // Legacy shape (e.g. old /api/predictions): treat whole body as data.
    return { data: json as T, dataMode: 'demo', raw: json };
  }
  if (!json.ok) {
    throw new ApiError(json.error.code, json.error.messageKiny, json.error.messageEn);
  }
  return { data: json.data as T, dataMode: json.dataMode, raw: json };
}
