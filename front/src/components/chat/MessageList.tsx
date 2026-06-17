// components/chat/MessageList.tsx
// 메시지 스크롤 영역 — 자동 스크롤 훅 부착.

import { useChatStore } from '@/store/chatStore';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { MessageBubble } from './MessageBubble';
import type { Message } from '@/types/message.type';
import type { AnnouncementSource } from '@/types/announcement.type';

interface Props {
  onOpenPreview: (s: AnnouncementSource) => void;
  onExpandGraph: (key: string) => void;
  onSendFollowup: (text: string) => void;
  onRetry: () => void;
  showMiniGraph: boolean;
}

export function MessageList(props: Props) {
  const messages = useChatStore((s) => s.messages);
  const ragStep = useChatStore((s) => s.ragStep);
  const ref = useAutoScroll<HTMLDivElement>({ deps: [messages, ragStep] });

  const handleCopy = (text: string) => {
    try { void navigator.clipboard.writeText(text); } catch { /* noop */ }
  };

  const handleToggleBookmark = (msg: Message) => {
    // 보관함 토글은 페이지 레이어에서 처리 — 이벤트로 발행
    window.dispatchEvent(new CustomEvent('cd:bookmark', { detail: msg }));
  };

  return (
    <div ref={ref} className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-4 px-4 pb-8 pt-7 sm:px-6">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            msg={m}
            ragStep={ragStep}
            onCopy={handleCopy}
            onToggleBookmark={handleToggleBookmark}
            {...props}
          />
        ))}
      </div>
    </div>
  );
}
