import { NextResponse } from 'next/server';
import type { ApiErr, ApiOk } from '@/types/api';
import type { DataMode } from '@/types/provenance';

export function ok<T>(data: T, dataMode: DataMode = 'live', init?: { status?: number }): NextResponse<ApiOk<T>> {
  return NextResponse.json(
    { ok: true, data, dataMode, fetchedAt: new Date().toISOString() },
    { status: init?.status ?? 200 },
  );
}

export function err(
  code: string,
  messageKiny: string,
  messageEn: string,
  status = 500,
  dataMode: DataMode = 'live',
): NextResponse<ApiErr> {
  return NextResponse.json(
    { ok: false, error: { code, messageKiny, messageEn }, dataMode, fetchedAt: new Date().toISOString() },
    { status },
  );
}
