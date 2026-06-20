// 상단바 — 사이드바 토글, 로고+타이틀, 마지막 동기화, 지식 그래프, 공유

import { useState } from 'react';
import { IconButton } from '@/components/common/IconButton';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { CDLogo } from '@/components/common/CDLogo';
import { useSidebarStore } from '@/store/sidebarStore';
import { useChatStore } from '@/store/chatStore';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { formatSyncTime } from '@/utils/formatDate';

interface Props {
  onOpenGraph: () => void;
  onOpenAdmin?: () => void;
  onOpenSettings?: () => void;
}

export function Header({ onOpenGraph, onOpenAdmin, onOpenSettings }: Props) {
  const toggleSidebar = useSidebarStore((s) => s.toggleSidebar);
  const hasMessages = useChatStore((s) => s.messages.length > 0);
  const resetChat = useChatStore((s) => s.resetChat);
  const { meta } = useAnnouncements();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <header className="flex flex-shrink-0 items-center justify-between border-b border-line
                       bg-white/70 px-3 py-3.5 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3.5">
        <IconButton aria-label="사이드바 토글" onClick={toggleSidebar}>
          <Icon.Menu />
        </IconButton>
        <button onClick={resetChat} aria-label="메인 화면으로 이동" className="cursor-pointer">
          <CDLogo size="sm" />
        </button>
        <div className="flex flex-col leading-tight">
          <span className="text-[14.5px] font-semibold text-ink">
            청담 <span className="ml-1 text-[12px] font-medium text-ink-4">淸潭</span>
          </span>
          <span className="mt-0.5 hidden text-[11.5px] text-ink-3 sm:block">
            경북대학교 공지사항 어시스턴트
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {meta && (
          <div className="hidden items-center gap-1.5 whitespace-nowrap text-[11.5px] text-ink-3 sm:flex">
            <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500
                             shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
            마지막 동기화 {formatSyncTime(meta.lastCrawledAt)}
          </div>
        )}
        {hasMessages && (
          <Button variant="pill" leadingIcon={<Icon.Graph />} onClick={onOpenGraph}>
            지식 그래프
          </Button>
        )}
        {onOpenAdmin && (
          <IconButton aria-label="데이터 수집 모니터링" onClick={onOpenAdmin}>
            <Icon.Refresh />
          </IconButton>
        )}
        {onOpenSettings && (
          <IconButton aria-label="설정" onClick={onOpenSettings}>
            <Icon.Settings />
          </IconButton>
        )}
        <Button variant="pill" leadingIcon={<Icon.Share />} onClick={handleShare}>
          {copied ? '복사됨' : '공유'}
        </Button>
      </div>
    </header>
  );
}
