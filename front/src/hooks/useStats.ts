// hooks/useStats.ts
// 대시보드 데이터 — 통계 + 크롤 로그를 일정 주기로 폴링.

import { useEffect, useState } from 'react';
import { fetchStats, fetchCrawlLogs } from '@/api/stats.api';
import type { StatsResponse, CrawlLogEntry } from '@/types/stats.type';

const STATS_INTERVAL_MS = 30_000;   // 30초 — 통계는 자주 안 바뀜
const LOG_INTERVAL_MS   = 3_000;    // 3초  — 크롤 진행 중일 때 부드러운 갱신

export function useStats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [logs, setLogs] = useState<CrawlLogEntry[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // stats — 30초 주기
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchStats()
        .then((s) => { if (alive) setStats(s); })
        .catch((e: Error) => { if (alive) setError(e); });
    load();
    const id = setInterval(load, STATS_INTERVAL_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // logs — 3초 주기 (running 일 때만 빠르게, 평소엔 일찍 끊기)
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchCrawlLogs()
        .then((r) => { if (alive) setLogs(r.logs); })
        .catch(() => { /* ignore */ });
    load();
    const id = setInterval(load, LOG_INTERVAL_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return { stats, logs, error };
}
