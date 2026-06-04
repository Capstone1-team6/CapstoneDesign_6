// store/sidebarStore.ts
// 사이드바 열림/닫힘 · 활성 탭 · 채팅 세션 목록 · 보관함.
// (PRD 9-2)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatSession, BookmarkedMessage } from '@/types/chat.type';
import type { Message } from '@/types/message.type';

export type SidebarTab = 'chat' | 'bookmarks';

interface SidebarState {
  isOpen: boolean;
  activeTab: SidebarTab;
  selectedSessionId: string | null;
  chatSessions: ChatSession[];
  bookmarks: BookmarkedMessage[];
  isLoadingHistory: boolean;
}

interface SidebarActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: SidebarTab) => void;
  selectSession: (id: string | null) => void;
  setChatSessions: (sessions: ChatSession[]) => void;
  removeSession: (id: string) => void;
  setLoadingHistory: (loading: boolean) => void;
  addBookmark: (msg: Message, sessionId: string) => void;
  removeBookmark: (messageId: string) => void;
  isBookmarked: (messageId: string) => boolean;
}

export const useSidebarStore = create<SidebarState & SidebarActions>()(
  persist(
    (set, get) => ({
      isOpen: true,
      activeTab: 'chat',
      selectedSessionId: null,
      chatSessions: [],
      bookmarks: [],
      isLoadingHistory: false,

      toggleSidebar: () => set((s) => ({ isOpen: !s.isOpen })),
      setSidebarOpen: (open) => set({ isOpen: open }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      selectSession: (id) => set({ selectedSessionId: id }),
      setChatSessions: (sessions) => set({ chatSessions: sessions }),
      removeSession: (id) =>
        set((s) => ({ chatSessions: s.chatSessions.filter((c) => c.id !== id) })),
      setLoadingHistory: (loading) => set({ isLoadingHistory: loading }),

      addBookmark: (msg, sessionId) =>
        set((s) => {
          if (s.bookmarks.some((b) => b.messageId === msg.id)) return s;
          const firstSource = msg.sources?.[0];
          const snippet =
            (msg.content ?? '').replace(/[*#\n]/g, ' ').slice(0, 100) + '...';
          return {
            bookmarks: [
              {
                messageId: msg.id,
                sessionId,
                title: firstSource?.title ?? snippet.slice(0, 32),
                snippet,
                category: firstSource?.category,
                sources: msg.sources,
                bookmarkedAt: new Date().toISOString(),
              },
              ...s.bookmarks,
            ],
          };
        }),

      removeBookmark: (messageId) =>
        set((s) => ({
          bookmarks: s.bookmarks.filter((b) => b.messageId !== messageId),
        })),

      isBookmarked: (messageId) =>
        get().bookmarks.some((b) => b.messageId === messageId),
    }),
    {
      name: 'cheongdam:sidebar',
      // 영속화 대상은 보관함과 사이드바 열림 상태만
      partialize: (s) => ({ isOpen: s.isOpen, bookmarks: s.bookmarks }),
    },
  ),
);
