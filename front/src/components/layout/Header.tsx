import { useState } from 'react';
import { IconButton } from '@/components/common/IconButton';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { CDLogo } from '@/components/common/CDLogo';
import { Toast } from '@/components/common/Toast';
import { useSidebarStore } from '@/store/sidebarStore';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { formatSyncTime } from '@/utils/formatDate';

interface Props {
  onOpenAdmin?: () => void;
}

export function Header({ onOpenAdmin }: Props) {
  const isSidebarOpen = useSidebarStore((s) => s.isOpen);
  const setSidebarOpen = useSidebarStore((s) => s.setSidebarOpen);
  const { meta } = useAnnouncements();
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowToast(true);
    } catch {
      /* noop */
    }
  };

  return (
    <header className="flex flex-shrink-0 items-center justify-between bg-canvas px-3 py-3.5 sm:px-6">
      <div className="flex items-center gap-3.5">
        {!isSidebarOpen && (
          <>
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="사이드바 열기"
              className="group relative flex h-10 w-10 flex-shrink-0 items-center justify-center cursor-pointer"
            >
              <span className="transition-opacity group-hover:opacity-0">
                <CDLogo size="header" />
              </span>
              <span className="absolute inset-0 flex items-center justify-center text-ink-2
                                opacity-0 transition-opacity group-hover:opacity-100">
                <Icon.Sidebar />
              </span>
            </button>
            <div className="flex flex-col leading-tight">
              <span className="text-[16px] font-semibold text-ink">
                청담 <span className="ml-1 text-[14px] font-medium text-ink-4">淸潭</span>
              </span>
              <span className="mt-0.5 hidden text-[12px] text-ink-3 sm:block">
                경북대학교 공지사항 어시스턴트
              </span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {meta && (
          <div className="hidden items-center gap-1.5 whitespace-nowrap text-[11.5px] text-ink-3 sm:flex">
            <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500
                              shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
            마지막 동기화 {formatSyncTime(meta.lastCrawledAt)}
          </div>
        )}
        {onOpenAdmin && (
          <IconButton aria-label="데이터 수집 모니터링" onClick={onOpenAdmin}>
            <Icon.Refresh />
          </IconButton>
        )}
        <Button variant="pill" leadingIcon={<Icon.Share />} onClick={handleShare}>
          공유
        </Button>
      </div>

      <Toast
        message="링크가 복사되었습니다"
        show={showToast}
        onHide={() => setShowToast(false)}
      />
    </header>
  );
}
