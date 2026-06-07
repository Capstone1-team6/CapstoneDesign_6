// components/chat/MessageBubble.tsx
// 사용자 / 어시스턴트 메시지 말풍선.
// 어시스턴트 버블 hover 시 복사·즐겨찾기 액션 노출.

import { useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { IconButton } from '@/components/common/IconButton';
import { RAGPipeline } from './RAGPipeline';
import { AnnouncementCard } from './AnnouncementCard';
import { MiniGraph } from './MiniGraph';
import { RetrievalDebugPanel } from './RetrievalDebugPanel';
import { Markdown } from '@/utils/parseMarkdown';
import { cn } from '@/utils/cn';
import { useSidebarStore } from '@/store/sidebarStore';
import type { Message } from '@/types/message.type';
import type { AnnouncementSource } from '@/types/announcement.type';

interface Props {
  msg: Message;
  ragStep: number;
  onCopy: (text: string) => void;
  onToggleBookmark: (msg: Message) => void;
  onOpenPreview: (src: AnnouncementSource) => void;
  onExpandGraph: (msg: Message) => void;
  onSendFollowup: (text: string) => void;
  onRetry: () => void;
  showMiniGraph: boolean;
}

export function MessageBubble({
  msg, ragStep, onCopy, onToggleBookmark, onOpenPreview, onExpandGraph, onSendFollowup, onRetry,
  showMiniGraph,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [showRetrieval, setShowRetrieval] = useState(false);
  // 보관함 상태는 sidebarStore가 단일 출처. msg.isBookmarked 플래그는 무시.
  const isBookmarked = useSidebarStore((s) => s.bookmarks.some((b) => b.messageId === msg.id));
  const handleCopy = () => {
    onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  if (msg.role === 'user') {
    return (
      <div className="flex animate-msg-in justify-end gap-3.5">
        <div className="flex max-w-[78%] flex-col items-end gap-1.5">
          <div className="rounded-2xl rounded-br-md bg-brand-grad px-4 py-3
                          text-[14.5px] leading-relaxed text-white shadow-brand-glow
                          whitespace-pre-wrap">
            {msg.content}
          </div>
          <span className="px-1 text-[11px] text-ink-4">{msg.createdAt}</span>
        </div>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center
                        rounded-full bg-line-2 text-ink-3">
          <Icon.User width={16} height={16} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-msg-in gap-3.5">
      <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center
                      rounded-full bg-brand-grad text-white shadow-brand-glow">
        {(msg.isLoading || msg.streaming) && (
          <span className="absolute inset-[-6px] rounded-full animate-pulse-soft"
                style={{
                  background: 'radial-gradient(circle, rgba(91,174,220,0.4), transparent 70%)',
                }} />
        )}
        <Icon.BotDrop width={18} height={18} />
      </div>

      <div className="flex max-w-[90%] flex-col gap-1.5">
        {msg.isLoading ? (
          <RAGPipeline stepIdx={ragStep} />
        ) : (
          <>
            <div
              className={cn(
                'rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3',
                'text-[14.5px] leading-relaxed text-ink',
                'prose prose-sm max-w-none prose-strong:font-semibold',
                msg.isError && 'border-red-200 bg-red-50/60 text-red-900',
              )}
            >
              <Markdown>{msg.content || ' '}</Markdown>
              {msg.streaming && (
                <span className="ml-0.5 inline-block h-4 w-[7px] align-text-bottom rounded-sm
                                 bg-brand-500 animate-blink" />
              )}
            </div>

            {msg.isError && (
              <button onClick={onRetry}
                      className="self-start flex items-center gap-1.5 rounded-full border border-red-200
                                 bg-white px-3 py-1.5 text-[12px] font-medium text-red-600
                                 hover:bg-red-50">
                <Icon.Refresh /> 다시 시도
              </button>
            )}

            {!msg.streaming && !msg.isError && (
              <div className="flex items-center gap-1 group">
                <span className="text-[11px] text-ink-4 px-1">{msg.createdAt}</span>
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                  <IconButton aria-label="복사" size="sm" onClick={handleCopy}>
                    {copied ? <Icon.Check /> : <Icon.Copy />}
                  </IconButton>
                  <IconButton aria-label="즐겨찾기" size="sm"
                              onClick={() => onToggleBookmark(msg)}
                              className={cn(isBookmarked && '!text-amber-500')}>
                    {isBookmarked ? <Icon.BookmarkFill /> : <Icon.Bookmark />}
                  </IconButton>
                </div>
              </div>
            )}

            {!msg.streaming && msg.sources && msg.sources.length > 0 && (
              <SourcesSection sources={msg.sources} onPreview={onOpenPreview} />
            )}

            {!msg.streaming && showMiniGraph && (msg.graphKey || msg.graphData) && (
              <MiniGraph
                graphKey={msg.graphKey ?? 'general'}
                onExpand={() => onExpandGraph(msg)}
              />
            )}

            {!msg.streaming && msg.retrieval && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowRetrieval((s) => !s)}
                  className="flex items-center gap-1.5 rounded-md border-0 bg-transparent
                             px-2 py-1 text-[11.5px] font-medium text-ink-3
                             cursor-pointer transition-colors hover:bg-canvas hover:text-ink-2"
                  aria-expanded={showRetrieval}
                >
                  <Icon.Search />
                  {showRetrieval ? '검색 과정 접기' : '검색 과정 보기'}
                  <span className="text-ink-4">
                    · Vector {msg.retrieval.vector.length} · Graph {msg.retrieval.graph.length}
                    {msg.retrieval.contextLength > 0
                      ? ` · 컨텍스트 ${msg.retrieval.contextLength.toLocaleString()}자`
                      : ''}
                  </span>
                </button>
                {showRetrieval && <RetrievalDebugPanel data={msg.retrieval} />}
              </div>
            )}

            {!msg.streaming && msg.followups && msg.followups.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {msg.followups.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => onSendFollowup(f)}
                    className="flex items-center gap-1.5 rounded-full border border-line
                               bg-surface px-3 py-1.5 text-[12.5px] text-ink-2 transition-colors
                               hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Icon.Sparkle className="text-brand-500" /> {f}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SourcesSection({
  sources, onPreview,
}: {
  sources: AnnouncementSource[];
  onPreview: (s: AnnouncementSource) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-2 flex flex-col gap-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex select-none items-center gap-2 px-1 pb-1 pt-2
                   text-[12px] font-semibold tracking-wide text-ink-3"
      >
        <Icon.Chevron className={cn('transition-transform', open && 'rotate-90')} />
        <Icon.Doc />
        참조한 공지 {sources.length}건
      </button>
      {open && (
        <div className="flex flex-col gap-2">
          {sources.map((s) => (
            <AnnouncementCard key={s.id} source={s} onPreview={onPreview} />
          ))}
        </div>
      )}
    </div>
  );
}
