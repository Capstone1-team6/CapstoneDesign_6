// api/sync.api.ts
// 크롤러 트리거 + 진행 상태 조회.

import { http } from '@/lib/axios';
import { ENDPOINTS } from '@/constants/api.constant';

export type SyncStep =
  | 'idle'
  | 'crawl'
  | 'download'
  | 'parse'
  | 'vector'
  | 'graph'
  | 'reload'
  | 'done'
  | 'error';

export interface SyncStatus {
  running: boolean;
  step: SyncStep;
  message: string;
  lastError?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export async function triggerSync(maxPages = 3): Promise<void> {
  await http.post(ENDPOINTS.crawl, { maxPages });
}

export async function fetchSyncStatus(): Promise<SyncStatus> {
  const { data } = await http.get<SyncStatus>(ENDPOINTS.crawlStatus);
  return data;
}
