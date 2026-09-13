import type { DataMode } from './provenance';

/** Success envelope for all Ibihe APIs. */
export interface ApiOk<T> {
  ok: true;
  data: T;
  /** Live vs demo provenance of the payload. */
  dataMode: DataMode;
  fetchedAt: string;
}

/** Error envelope for all Ibihe APIs. */
export interface ApiErr {
  ok: false;
  error: {
    code: string;
    messageKiny: string;
    messageEn: string;
  };
  dataMode: DataMode;
  fetchedAt: string;
}

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
