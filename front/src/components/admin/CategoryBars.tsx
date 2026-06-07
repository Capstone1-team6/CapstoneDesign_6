// components/admin/CategoryBars.tsx
// 카테고리 분포 — 가로 막대 (외부 차트 라이브러리 없이 div 너비로 구현).

import type { CategoryBucket } from '@/types/stats.type';

interface Props {
  buckets: CategoryBucket[];
}

const COLORS: Record<string, string> = {
  '학사':   'bg-brand-500',
  '장학':   'bg-amber-500',
  '취업':   'bg-emerald-500',
  '행사':   'bg-pink-500',
  '기숙사': 'bg-violet-500',
  '국제':   'bg-cyan-500',
  '기타':   'bg-ink-3',
};

export function CategoryBars({ buckets }: Props) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="flex flex-col gap-3 rounded-cd-lg border border-line bg-surface px-5 py-4">
      <h3 className="text-[13px] font-semibold tracking-tight text-ink">카테고리 분포</h3>
      {buckets.length === 0 ? (
        <div className="py-6 text-center text-[12px] text-ink-3">데이터 없음</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {buckets.map((b) => (
            <div key={b.category} className="flex items-center gap-2.5">
              <span className="w-14 flex-shrink-0 text-[12px] font-medium text-ink-2">
                {b.category}
              </span>
              <div className="flex-1 overflow-hidden rounded-full bg-canvas">
                <div
                  className={`${COLORS[b.category] ?? 'bg-ink-3'} h-2 rounded-full transition-all`}
                  style={{ width: `${(b.count / max) * 100}%` }}
                />
              </div>
              <span className="w-8 flex-shrink-0 text-right text-[12px] font-semibold text-ink">
                {b.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
