// api/announcement.api.ts
// 크롤링된 공지사항 메타 조회 — 마지막 동기화 시각·전체 건수.

import { http } from '@/lib/axios';
import { ENDPOINTS, USE_MOCK_API } from '@/constants/api.constant';
import type { MetaResponse } from '@/types/chat.type';

export async function fetchMeta(): Promise<MetaResponse> {
  if (USE_MOCK_API) {
    return {
      lastCrawledAt: new Date(new Date().setHours(2, 0, 0, 0)).toISOString(),
      totalAnnouncements: 12_843,
    };
  }
  const { data } = await http.get<MetaResponse>(ENDPOINTS.meta);
  return data;
}
