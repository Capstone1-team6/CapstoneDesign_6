// pages/admin/DashboardPage.tsx
// 데이터 수집 모니터링 대시보드 — 관리자 검증용.

import { IconButton } from '@/components/common/IconButton';
import { Icon } from '@/components/common/Icon';
import { CDLogo } from '@/components/common/CDLogo';
import { StatCard } from '@/components/admin/StatCard';
import { CategoryBars } from '@/components/admin/CategoryBars';
import { TimelineSparkline } from '@/components/admin/TimelineSparkline';
import { CrawlLogStream } from '@/components/admin/CrawlLogStream';
import { LatestNoticesList } from '@/components/admin/LatestNoticesList';
import { useStats } from '@/hooks/useStats';
import { formatSyncTime } from '@/utils/formatDate';

interface Props {
  onClose: () => void;
}

const STEP_LABEL: Record<string, string> = {
  idle: '대기 중',
  crawl: '공지 목록 크롤링',
  download: '첨부파일 다운로드',
  parse: '문서 파싱',
  vector: 'Vector DB 증분 갱신',
  graph: 'Graph DB 증분 갱신',
  reload: '검색 캐시 갱신',
  done: '동기화 완료',
  error: '동기화 실패',
};

export function DashboardPage({ onClose }: Props) {
  const { stats, logs } = useStats();

  const totalNotices       = stats?.totalNotices ?? 0;
  const totalAttachments   = stats?.totalAttachments ?? 0;
  const lastCrawledAt      = stats?.lastCrawledAt ?? '';
  const sync               = stats?.syncStatus;
  const stepLabel          = sync ? STEP_LABEL[sync.step] ?? sync.step : '—';
  const running            = sync?.running ?? false;

  return (
    <div className="flex h-screen flex-col bg-canvas font-sans text-ink">
      {/* 상단 바 */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-line
                      bg-white/70 px-6 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <IconButton aria-label="뒤로가기" onClick={onClose}>
            <Icon.ArrowLeft />
          </IconButton>
          <CDLogo size="sm" />
          <h1 className="m-0 text-[18px] font-semibold tracking-tight">데이터 수집 모니터링</h1>
        </div>
        {sync && (
          <div className="flex items-center gap-2 text-[12px]">
            <span className={
              `block h-1.5 w-1.5 rounded-full ${
                running
                  ? 'bg-brand-500 shadow-[0_0_0_3px_rgba(37,99,235,0.18)] animate-pulse'
                  : sync.step === 'error'
                  ? 'bg-red-500'
                  : 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]'
              }`
            } />
            <span className="text-ink-2">{stepLabel}</span>
            {sync.message && (
              <span className="ml-1 text-ink-3">· {sync.message}</span>
            )}
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
          {/* KPI 4장 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="총 공지"
              value={totalNotices.toLocaleString()}
              sub={lastCrawledAt ? `마지막 동기화 ${formatSyncTime(lastCrawledAt)}` : '미수집'}
              icon={<Icon.Doc />}
            />
            <StatCard
              label="총 첨부파일"
              value={totalAttachments.toLocaleString()}
              sub={
                totalNotices
                  ? `공지당 평균 ${(totalAttachments / totalNotices).toFixed(1)}건`
                  : '—'
              }
              icon={<Icon.Doc />}
            />
            <StatCard
              label="현재 단계"
              value={stepLabel}
              sub={sync?.message ?? ''}
              icon={<Icon.Refresh />}
            />
            <StatCard
              label="카테고리"
              value={stats?.categoryDistribution.length ?? 0}
              sub="자동 분류"
              icon={<Icon.Sparkle />}
            />
          </div>

          {/* 추이 + 카테고리 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
            <TimelineSparkline points={stats?.timeline ?? []} />
            <CategoryBars buckets={stats?.categoryDistribution ?? []} />
          </div>

          {/* 로그 + 최근 공지 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr]">
            <CrawlLogStream logs={logs} running={running} />
            <LatestNoticesList notices={stats?.latestNotices ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}
