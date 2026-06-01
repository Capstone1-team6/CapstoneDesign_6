// components/chat/SourcePreviewPanel.tsx
// 출처 미리보기 사이드 패널 — 인용 키워드 형광펜 강조.

import { useEffect, type ReactNode } from 'react';
import { Icon } from '@/components/common/Icon';
import { IconButton } from '@/components/common/IconButton';
import type { AnnouncementSource } from '@/types/announcement.type';

interface Props {
  source: AnnouncementSource | null;
  open: boolean;
  onClose: () => void;
}

export function SourcePreviewPanel({ source, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className="fixed right-0 top-0 z-[90] flex h-full w-[min(480px,95vw)] flex-col
                 border-l border-line bg-surface
                 shadow-[-8px_0_32px_rgba(15,35,80,0.10)] transition-transform duration-300"
      style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          {source && (
            <span className="rounded-full bg-brand-50 px-2 py-[3px] text-[10.5px] font-semibold
                             tracking-wide text-brand-700">
              {source.category}
            </span>
          )}
          <span className="text-[11.5px] text-ink-3">출처 미리보기 · 인용 위치 강조</span>
        </div>
        <IconButton aria-label="닫기" onClick={onClose}><Icon.X /></IconButton>
      </div>
      {source && (
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <h3 className="mb-1.5 text-[18px] font-semibold tracking-tight">{source.title}</h3>
          <div className="mb-5 flex items-center gap-2.5 text-[12px] text-ink-3">
            <span className="flex items-center gap-1">
              <Icon.Calendar className="text-ink-4" /> {source.publishedAt}
            </span>
            <span className="text-ink-4">·</span>
            <a href={source.url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-[12px] text-brand-500 no-underline">
              <Icon.External /> 원문 보기
            </a>
          </div>
          <div className="whitespace-pre-wrap text-[14px] leading-[1.75] text-ink-2">
            {renderHighlighted(source.body ?? '', source.highlights)}
          </div>
          <div className="mt-6 rounded-cd-md border border-dashed border-line bg-surface-2 p-3.5
                          text-[12px] leading-snug text-ink-3">
            <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-ink-2">
              <Icon.Sparkle className="text-brand-500" /> 청담의 노트
            </div>
            답변에 인용된 구절을 형광펜으로 표시했어요.
            출처 원문에서 직접 발췌한 부분만 강조됩니다 — 환각 없이.
          </div>
        </div>
      )}
    </div>
  );
}

function renderHighlighted(body: string, highlights?: string[]): ReactNode {
  if (!highlights?.length || !body) return body;
  const sorted = [...highlights].sort((a, b) => b.length - a.length);
  const pat = sorted.map((s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  if (!pat) return body;
  const re = new RegExp('(' + pat + ')', 'g');
  return body.split(re).map((p, i) =>
    re.test(p) ? (
      <mark key={i}
            className="rounded-sm bg-brand-100/80 px-0.5 font-semibold text-brand-700
                       shadow-[inset_0_-2px_0_rgba(37,99,235,0.3)]">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
