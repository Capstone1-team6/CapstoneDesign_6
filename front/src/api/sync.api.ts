// api/sync.api.ts
// 크롤러 트리거 + 진행 상태 조회.

import { http } from '@/lib/axios';
import { ENDPOINTS } from '@/constants/api.constant';

export async function triggerSync(maxPages = 3): Promise<void> {
  await http.post(ENDPOINTS.crawl, { maxPages });
}

export async function fetchSyncStatus(): Promise<{ running: boolean; lastError?: string | null }> {
  const { data } = await http.get<{ running: boolean; lastError?: string | null }>(ENDPOINTS.crawlStatus);
  return data;
}
