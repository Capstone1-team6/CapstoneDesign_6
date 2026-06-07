// components/admin/CrawlLogStream.tsx
// 실시간 크롤 로그 — 단계별 컬러 + 자동 스크롤.

import { useEffect, useRef } from 'react';
import type { CrawlLogEntry } from '@/types/stats.type';
import { cn } from '@/utils/cn';

interface Props {
  logs: CrawlLogEntry[];
  running: boolean;
}

const STEP_LABEL: Record<string, string> = {
  idle: '대기',
  crawl: '크롤',
  download: '첨부',
  parse: '파싱',
  vector: '벡터',
  graph: '그래프',
  reload: '리로드',
  done: '완료',
  error: '오류',
};

const STEP_COLOR: Record<string, string> = {
  idle: 'bg-ink-3',
  crawl: 'bg-brand-500',
  download: 'bg-amber-500',
  parse: 'bg-violet-500',
  vector: 'bg-emerald-500',
  graph: 'bg-pink-500',
  reload: 'bg-cyan-500',
  done: 'bg-emerald-600',
  error: 'bg-red-500',
};

export function CrawlLogStream({ logs, running }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className="flex h-[320px] flex-col rounded-cd-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line-2 px-5 py-3">
        <h3 className="text-[13px] font-semibold tracking-tight text-ink">실시간 동기화 로그</h3>
        <div className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
          <span className={cn(
            'block h-1.5 w-1.5 rounded-full',
            running
              ? 'bg-brand-500 shadow-[0_0_0_3px_rgba(37,99,235,0.18)] animate-pulse'
              : 'bg-ink-4',
          )} />
          {running ? '진행 중' : '대기'}
        </div>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11.5px]">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-ink-3">
            아직 로그가 없습니다. 설정에서 "지금 동기화" 를 누르면 단계별 로그가 표시됩니다.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {logs.map((l, i) => (
              <div key={i} className="flex items-start gap-2.5 px-2 py-1">
                <span className="mt-[3px] text-ink-4">{l.ts.slice(11, 19)}</span>
                <span className={cn(
                  'rounded px-1.5 py-px text-[10px] font-semibold text-white',
                  STEP_COLOR[l.step] ?? 'bg-ink-3',
                )}>
                  {STEP_LABEL[l.step] ?? l.step}
                </span>
                <span className={cn(
                  'flex-1',
                  l.level === 'error' ? 'text-red-600' : 'text-ink-2',
                )}>
                  {l.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
