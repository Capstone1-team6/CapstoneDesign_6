// types/stats.type.ts
// 데이터 수집 모니터링 대시보드용 도메인 모델

export interface CategoryBucket {
  category: string;
  count: number;
}

export interface TimelinePoint {
  date: string;   // YYYY-MM-DD
  count: number;
}

export interface LatestNotice {
  num: string;
  title: string;
  date: string;
  url: string;
  category: string;
  attachmentCount: number;
}

export interface SyncStatus {
  running: boolean;
  step: 'idle' | 'crawl' | 'download' | 'parse' | 'vector' | 'graph' | 'reload' | 'done' | 'error';
  message: string;
  lastError: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface StatsResponse {
  totalNotices: number;
  totalAttachments: number;
  categoryDistribution: CategoryBucket[];
  timeline: TimelinePoint[];        // 최근 30일
  latestNotices: LatestNotice[];     // 최신 10건
  lastCrawledAt: string;
  syncStatus: SyncStatus;
}

export interface CrawlLogEntry {
  ts: string;                 // ISO datetime
  level: 'info' | 'warn' | 'error';
  step: SyncStatus['step'];
  message: string;
}

export interface CrawlLogsResponse {
  logs: CrawlLogEntry[];
}
