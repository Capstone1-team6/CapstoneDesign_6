// components/chat/AnnouncementCard.tsx
// 출처 공지 카드 — 카테고리 배지 · 제목 · 내용 첫 문장 · 작성일 · 외부 링크.

import { Icon } from '@/components/common/Icon';
import { highlightBold } from '@/utils/parseMarkdown';
import type { AnnouncementSource } from '@/types/announcement.type';
import { cn } from '@/utils/cn';

const CATEGORY_COLORS: Record<string, string> = {
  '학사':   'bg-brand-50 text-brand-700',
  '장학':   'bg-amber-50 text-amber-900',
  '취업':   'bg-emerald-50 text-emerald-800',
  '기숙사': 'bg-violet-50 text-violet-800',
  '행사':   'bg-pink-50 text-pink-800',
};

interface Props {
  source: AnnouncementSource;
  onPreview: (s: AnnouncementSource) => void;
}

export function AnnouncementCard({ source, onPreview }: Props) {
  const catCls = CATEGORY_COLORS[source.category] ?? 'bg-canvas text-ink-2';
  return (
    <button
      type="button"
      onClick={() => onPreview(source)}
      className="group flex w-full flex-col gap-2 rounded-cd-md border border-line
                 bg-surface px-4 py-3.5 text-left transition-all
                 hover:border-brand-300 hover:shadow-cd-md"
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('rounded-full px-2 py-[3px] text-[10.5px] font-semibold tracking-wide', catCls)}>
            {source.category}
          </span>
          <span className="text-[11.5px] tabular-nums text-ink-4">{source.publishedAt}</span>
        </div>
        <Icon.External className="text-ink-4" />
      </div>
      <div className="text-[13.5px] font-semibold leading-snug text-ink">{source.title}</div>
      <div className="text-[12.5px] leading-relaxed text-ink-3">
        &ldquo;
        {highlightBold(source.summary).map((part, i) =>
          typeof part === 'string' ? (
            <span key={i}>{part}</span>
          ) : (
            <mark key={i} className="rounded-sm bg-brand-100/70 px-0.5 text-brand-700">
              {part.bold}
            </mark>
          ),
        )}
        &rdquo;
      </div>
      <div className="flex min-w-0 items-center gap-1.5 font-mono text-[11.5px] text-brand-500">
        <Icon.Globe width={12} height={12} className="flex-shrink-0" />
        <span className="truncate">{source.url.replace(/^https?:\/\//, '')}</span>
      </div>
    </button>
  );
}
