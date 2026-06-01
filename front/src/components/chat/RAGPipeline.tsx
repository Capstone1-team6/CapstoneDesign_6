// components/chat/RAGPipeline.tsx
// 4단계 RAG 파이프라인 — 크롤링 → 검색 → 재정렬 → 생성.
// stepIdx: 0 이상 — 현재까지 완료된 단계 개수 (1이면 step 1 활성).

import { Icon } from '@/components/common/Icon';
import { RAG_STEPS } from '@/constants/chat.constant';
import { cn } from '@/utils/cn';

interface Props {
  stepIdx: number;
}

export function RAGPipeline({ stepIdx }: Props) {
  return (
    <div className="flex min-w-[360px] flex-col gap-2.5 rounded-cd-lg
                    rounded-bl-md border border-line bg-surface px-4 py-3.5">
      {RAG_STEPS.map((s, i) => {
        const state: 'done' | 'active' | 'pending' =
          i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending';
        return (
          <div
            key={s.id}
            className={cn(
              'flex items-center gap-3 text-[13.5px] transition-colors',
              state === 'active' && 'font-medium text-ink',
              state === 'done'   && 'text-ink-2',
              state === 'pending' && 'text-ink-3',
            )}
          >
            <span className={cn(
              'relative flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full',
              state === 'done'   && 'bg-emerald-500 text-white',
              state === 'active' && 'bg-brand-50 text-brand-600',
              state === 'pending' && 'bg-canvas text-ink-4',
            )}>
              {state === 'done' ? (
                <Icon.Check width={14} height={14} />
              ) : state === 'active' ? (
                <span className="absolute inset-[-3px] rounded-full border-[1.5px]
                                 border-brand-300 border-t-transparent
                                 animate-[cd-spin_800ms_linear_infinite]"
                      style={{ animationName: 'cd-spin' }} />
              ) : (
                <span className="block h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            <span className="flex-1">{s.label}</span>
            <span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-ink-4">
              {s.tag}
            </span>
          </div>
        );
      })}
    </div>
  );
}
