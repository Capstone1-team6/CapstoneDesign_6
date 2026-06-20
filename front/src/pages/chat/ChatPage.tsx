import { useEffect, useState } from 'react';
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
import type { KnowledgeGraph } from '@/types/graph.type';

interface Props {
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
}

export function ChatPage({ onOpenSettings, onOpenAdmin }: Props) {
  const messages = useChatStore((s) => s.messages);
  const { send, abort, retryLast, isStreaming } = useChat();
  const { addBookmark, removeBookmark, isOpen: isSidebarOpen, toggleSidebar } = useSidebarStore();
  const sessionId = useChatStore((s) => s.sessionId);

  const [previewSource, setPreviewSource] = useState<AnnouncementSource | null>(null);
  const [graphKey, setGraphKey] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<KnowledgeGraph | null>(null);

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

  const closeGraphModal = () => {
    setGraphKey(null);
    setGraphData(null);
  };

  const isWelcome = messages.length === 0;

  return (
    <div className="relative flex h-[100dvh] w-screen overflow-hidden bg-canvas font-sans text-ink">
      <div className="pointer-events-none absolute inset-0 z-0"
           style={{
             backgroundImage:
               'radial-gradient(ellipse 800px 400px at 80% 25%, rgba(91, 174, 220, 0), transparent 60%),' +
               'radial-gradient(ellipse 600px 500px at 15% 95%, rgba(37, 99, 235, 0.05), transparent 60%)',
           }} />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[49] bg-ink/40 backdrop-blur-sm sm:hidden"
          onClick={toggleSidebar}
        />
      )}
      <Sidebar onOpenSettings={onOpenSettings} />
      <main className="relative z-[1] flex min-w-0 min-h-0 flex-1 flex-col">
        <Header onOpenAdmin={onOpenAdmin} />
        {isWelcome ? (
          <WelcomeScreen onPick={(q) => void send(q.title, q.id)} />
        ) : (
          <MessageList
            onOpenPreview={setPreviewSource}
            onExpandGraph={(m) => {
              setGraphData(m.graphData ?? null);
              setGraphKey(m.graphData ? null : m.graphKey ?? 'general');
            }}
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
      {(graphKey || graphData) && (
        <KnowledgeGraphModal
          graphKey={graphKey ?? 'general'}
          graphData={graphData ?? undefined}
          onClose={closeGraphModal}
        />
      )}
    </div>
  );
}
