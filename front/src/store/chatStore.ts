// store/chatStore.ts
// 현재 대화 상태 — 메시지·스트리밍 플래그·세션·중단 핸들.
// (PRD 9-1)

import { create } from 'zustand';
import type { Message } from '@/types/message.type';
import type { AnnouncementSource } from '@/types/announcement.type';

interface ChatState {
  sessionId: string | null;
  messages: Message[];
  isStreaming: boolean;
  /** RAG 파이프라인 단계 인덱스 (0=crawl, 4=완료) */
  ragStep: number;
  abortController: AbortController | null;
  /** 에러 시 재시도용 — 직전 사용자 메시지 텍스트 보존 (PRD F-UX-04) */
  lastUserMessage: string | null;
}

interface ChatActions {
  setSessionId: (id: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  appendStreamChunk: (id: string, chunk: string) => void;
  finalizeStream: (
    id: string,
    payload: { sources?: AnnouncementSource[]; followups?: string[]; graphKey?: string },
  ) => void;
  toggleBookmark: (id: string) => void;
  setStreaming: (v: boolean) => void;
  setRagStep: (n: number) => void;
  setAbortController: (c: AbortController | null) => void;
  setLastUserMessage: (msg: string) => void;
  loadSession: (sessionId: string, messages: Message[]) => void;
  resetChat: () => void;
}

const initialState: ChatState = {
  sessionId: null,
  messages: [],
  isStreaming: false,
  ragStep: 0,
  abortController: null,
  lastUserMessage: null,
};

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  ...initialState,

  setSessionId: (id) => set({ sessionId: id }),

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  removeMessage: (id) =>
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

  appendStreamChunk: (id, chunk) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: (m.content ?? '') + chunk } : m,
      ),
    })),

  finalizeStream: (id, payload) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id
          ? { ...m, ...payload, streaming: false, isLoading: false }
          : m,
      ),
      isStreaming: false,
      ragStep: 0,
    })),

  toggleBookmark: (id) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, isBookmarked: !m.isBookmarked } : m,
      ),
    })),

  setStreaming: (v) => set({ isStreaming: v }),
  setRagStep: (n) => set({ ragStep: n }),
  setAbortController: (c) => set({ abortController: c }),
  setLastUserMessage: (msg) => set({ lastUserMessage: msg }),

  loadSession: (sessionId, messages) => set({ sessionId, messages }),
  resetChat: () => set({ ...initialState }),
}));
