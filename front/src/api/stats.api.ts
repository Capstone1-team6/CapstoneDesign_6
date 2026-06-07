// api/stats.api.ts
// 데이터 수집 대시보드 — 통계 + 크롤 로그.

import { http } from '@/lib/axios';
import { ENDPOINTS } from '@/constants/api.constant';
import type { StatsResponse, CrawlLogsResponse } from '@/types/stats.type';

export async function fetchStats(): Promise<StatsResponse> {
  const { data } = await http.get<StatsResponse>(ENDPOINTS.stats);
  return data;
}

export async function fetchCrawlLogs(): Promise<CrawlLogsResponse> {
  const { data } = await http.get<CrawlLogsResponse>(ENDPOINTS.crawlLogs);
  return data;
}
