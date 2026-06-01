// hooks/useChatHistory.ts
// 사이드바 히스토리 로드 + 삭제 + 보관함 토글.

import { useCallback, useEffect } from 'react';
import { useSidebarStore } from '@/store/sidebarStore';
import { fetchHistoryList, deleteSession, fetchSessionDetail } from '@/api/history.api';
import { useChatStore } from '@/store/chatStore';

export function useChatHistory() {
  const {
    chatSessions, isLoadingHistory, setChatSessions, setLoadingHistory, removeSession,
  } = useSidebarStore();
  const { loadSession, resetChat } = useChatStore();

  const refresh = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const sessions = await fetchHistoryList();
      setChatSessions(sessions);
    } catch {
      // 사이드바 토스트는 호출 측에서
    } finally {
      setLoadingHistory(false);
    }
  }, [setChatSessions, setLoadingHistory]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openSession = useCallback(
    async (id: string) => {
      const msgs = await fetchSessionDetail(id);
      loadSession(id, msgs);
    },
    [loadSession],
  );

  const removeAndMaybeReset = useCallback(
    async (id: string) => {
      await deleteSession(id);
      removeSession(id);
      if (useChatStore.getState().sessionId === id) {
        resetChat();
      }
    },
    [removeSession, resetChat],
  );

  return {
    sessions: chatSessions,
    isLoading: isLoadingHistory,
    refresh,
    openSession,
    deleteSession: removeAndMaybeReset,
  };
}
