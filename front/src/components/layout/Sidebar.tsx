import { useMemo } from 'react';
import { CDLogo } from '@/components/common/CDLogo';
import { Icon } from '@/components/common/Icon';
import { IconButton } from '@/components/common/IconButton';
import { useSidebarStore } from '@/store/sidebarStore';
import { useChatStore } from '@/store/chatStore';
import { useChatHistory } from '@/hooks/useChatHistory';
import { groupByDate } from '@/utils/groupByDate';
import { cn } from '@/utils/cn';

interface Props {
  onOpenSettings: () => void;
}

export function Sidebar({ onOpenSettings }: Props) {
  const {
    isOpen, activeTab, setActiveTab, bookmarks, selectedSessionId, setSidebarOpen,
  } = useSidebarStore();
  const resetChat = useChatStore((s) => s.resetChat);

  const closeMobile = () => { if (window.innerWidth < 640) setSidebarOpen(false); };
  const { sessions, openSession, deleteSession } = useChatHistory();

  const grouped = useMemo(() => groupByDate(sessions), [sessions]);

  return (
    <aside
      className={cn(
        'flex w-[280px] flex-col border-r border-line bg-white',
        'fixed inset-y-0 left-0 z-[50]',
        'transition-[transform,opacity] duration-200',
        'sm:relative sm:z-[1] sm:flex-shrink-0',
        'sm:transition-[margin,opacity]',
        !isOpen && '-translate-x-full opacity-0 sm:translate-x-0 sm:-ml-[280px]',
      )}
      aria-hidden={!isOpen || undefined}
      {...(!isOpen ? { inert: '' } : {})}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <button onClick={resetChat} aria-label="메인 화면으로 이동" className="cursor-pointer">
          <CDLogo size="sm" />
        </button>
        <div className="flex flex-1 flex-col leading-tight">
          <span className="text-[18px] font-bold text-ink">
            청담<span className="ml-1.5 text-[14px] font-medium text-ink-4 tracking-wide">淸潭</span>
          </span>
        </div>
        <IconButton aria-label="사이드바 닫기" onClick={() => setSidebarOpen(false)}>
          <Icon.Sidebar />
        </IconButton>
      </div>

      {/* New chat */}
      <div className="px-3 pb-1 pt-2">
        <button
          type="button"
          onClick={() => { resetChat(); closeMobile(); }}
          className="flex w-full items-center gap-2.5 rounded-cd-md bg-brand-grad
                      px-3.5 py-2.5 text-left text-[13.5px] font-semibold text-white
                      shadow-brand-glow transition-transform hover:-translate-y-px"
        >
          <Icon.Plus />
          <span>새로운 채팅</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 px-3 pb-1 pt-1.5">
        {(['chat', 'bookmarks'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-cd-sm',
              'px-2.5 py-2 text-[12.5px] font-medium transition-colors',
              activeTab === tab
                ? 'bg-brand-50 text-brand-600'
                : 'bg-transparent text-ink-3 hover:bg-line-2 hover:text-ink-2',
            )}
          >
            {tab === 'chat' ? <Icon.Chat /> : <Icon.Bookmark />}
            {tab === 'chat' ? '대화 기록' : '내 보관함'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-1 flex-col gap-px overflow-y-auto px-2 pb-4 pt-1">
        {activeTab === 'chat' ? (
          grouped.length === 0 ? (
            <EmptyState text="아직 대화 기록이 없어요" />
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group}>
                <div className="px-4 pb-1.5 pt-3 text-[10.5px] font-semibold uppercase
                                tracking-wider text-ink-4">{group}</div>
                {items.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { void openSession(s.id); closeMobile(); }}
                    className={cn(
                      'group flex w-full items-center gap-2.5 rounded-cd-sm px-3 py-2.5',
                      'text-left text-[13px] transition-colors',
                      s.id === selectedSessionId
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-2 hover:bg-canvas',
                    )}
                  >
                    <Icon.Chat className={cn(
                      'flex-shrink-0',
                      s.id === selectedSessionId ? 'text-brand-500' : 'text-ink-4',
                    )} />
                    <span className="min-w-0 flex-1 truncate font-medium">{s.title}</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); void deleteSession(s.id); }}
                      role="button" aria-label="대화 삭제"
                      className="flex cursor-pointer rounded p-1 text-ink-4 hover:bg-red-100
                                  hover:text-red-500 sm:hidden sm:group-hover:flex"
                    >
                      <Icon.Trash />
                    </span>
                  </button>
                ))}
              </div>
            ))
          )
        ) : (
          bookmarks.length === 0 ? (
            <EmptyState text="답변 옆 북마크로 저장하세요" icon={<Icon.Bookmark />} />
          ) : (
            <>
              <div className="px-4 pb-1.5 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-ink-4">
                저장된 답변 ({bookmarks.length})
              </div>
              {bookmarks.map((b) => (
                <div key={b.messageId}
                     className="flex flex-col gap-1 rounded-cd-sm p-3 hover:bg-canvas cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    {b.category && (
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold
                                       tracking-wide text-brand-700">{b.category}</span>
                    )}
                    <span className="flex-1" />
                    <span className="text-[10.5px] text-ink-4">{relativeTime(b.bookmarkedAt)}</span>
                  </div>
                  <div className="text-[13px] font-semibold leading-snug text-ink line-clamp-1">
                    {b.title}
                  </div>
                  <div className="text-[11.5px] leading-snug text-ink-3 line-clamp-2">
                    {b.snippet}
                  </div>
                </div>
              ))}
            </>
          )
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-line px-3 py-2.5">
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2.5 rounded-cd-sm px-3 py-2.5
                     text-left text-[13px] font-medium text-ink-2 hover:bg-canvas"
        >
          <Icon.Settings />
          <span>설정</span>
        </button>
      </div>
    </aside>
  );
}

function EmptyState({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-[11.5px] text-ink-4">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  const hrs = Math.floor(ms / 3_600_000);
  if (days >= 1) return `${days}일 전`;
  if (hrs >= 1)  return `${hrs}시간 전`;
  return '방금';
}
