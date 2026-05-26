// pages/chat/ChatPage.tsx
// 메인 챗봇 화면 — Welcome / MessageList / Composer + 모달 레이어.
// UI 조립만 담당 (PRD 규칙). 상태는 store, 로직은 hooks 에서.

import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { WelcomeScreen } from '@/components/chat/WelcomeScreen';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { SourcePreviewPanel } from '@/components/chat/SourcePreviewPanel';
import { KnowledgeGraphModal } from '@/components/chat/KnowledgeGraphModal';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/store/chatStore';
import { useSidebarStore } from '@/store/sidebarStore';
import type { AnnouncementSource } from '@/types/announcement.type';
import type { Message } from '@/types/message.type';

interface Props {
  onOpenSettings: () => void;
}

export function ChatPage({ onOpenSettings }: Props) {
  const messages = useChatStore((s) => s.messages);
  const { send, abort, retryLast, isStreaming } = useChat();
  const { addBookmark, removeBookmark } = useSidebarStore();
  const sessionId = useChatStore((s) => s.sessionId);

  const [previewSource, setPreviewSource] = useState<AnnouncementSource | null>(null);
  const [graphKey, setGraphKey] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<Message>).detail;
      const bookmarked = useSidebarStore.getState().bookmarks.some(
        (b) => b.messageId === msg.id,
      );
      if (bookmarked) {
        removeBookmark(msg.id);
      } else {
        addBookmark(msg, sessionId ?? 'new');
      }
    };
    window.addEventListener('cd:bookmark', handler);
    return () => window.removeEventListener('cd:bookmark', handler);
  }, [addBookmark, removeBookmark, sessionId]);

  const handleOpenTopicGraph = useCallback(() => {
    // 최신 답변 메시지의 graphKey, 없으면 general
    const lastWithGraph = [...messages].reverse().find((m) => m.graphKey);
    setGraphKey(lastWithGraph?.graphKey ?? 'general');
  }, [messages]);

  const isWelcome = messages.length === 0;

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-canvas font-sans text-ink">
      <div className="pointer-events-none absolute inset-0 z-0"
           style={{
             backgroundImage:
               'radial-gradient(ellipse 800px 400px at 80% 10%, rgba(91, 174, 220, 0.08), transparent 60%),' +
               'radial-gradient(ellipse 600px 500px at 15% 95%, rgba(37, 99, 235, 0.05), transparent 60%)',
           }} />
      <Sidebar onOpenSettings={onOpenSettings} />
      <main className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <Header onOpenGraph={handleOpenTopicGraph} />
        {isWelcome ? (
          <WelcomeScreen onPick={(q) => void send(q.title, q.id)} />
        ) : (
          <MessageList
            onOpenPreview={setPreviewSource}
            onExpandGraph={(k) => setGraphKey(k)}
            onSendFollowup={(text) => { if (!isStreaming) void send(text); }}
            onRetry={retryLast}
            showMiniGraph
          />
        )}
        <ChatInput
          isStreaming={isStreaming}
          onSend={(text) => void send(text)}
          onAbort={abort}
        />
      </main>

      <SourcePreviewPanel
        source={previewSource}
        open={!!previewSource}
        onClose={() => setPreviewSource(null)}
      />
      {graphKey && (
        <KnowledgeGraphModal graphKey={graphKey} onClose={() => setGraphKey(null)} />
      )}
    </div>
  );
}
