// api/history.api.ts
// 대화 히스토리 CRUD — 실서버/모킹 양쪽 모두에서 사용.

import { http } from '@/lib/axios';
import { ENDPOINTS, USE_MOCK_API } from '@/constants/api.constant';
import type { ChatSession } from '@/types/chat.type';
import type { Message } from '@/types/message.type';
import { mockHistory, mockSessionDetail } from './mock/mockHistory';

export async function fetchHistoryList(): Promise<ChatSession[]> {
  if (USE_MOCK_API) return mockHistory();
  const { data } = await http.get<{ sessions: ChatSession[] }>(ENDPOINTS.historyList);
  return data.sessions;
}

export async function fetchSessionDetail(sessionId: string): Promise<Message[]> {
  if (USE_MOCK_API) return mockSessionDetail(sessionId);
  const { data } = await http.get<{ sessionId: string; messages: Message[] }>(
    ENDPOINTS.historyDetail(sessionId),
  );
  return data.messages;
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (USE_MOCK_API) return;
  await http.delete(ENDPOINTS.historyDetail(sessionId));
}
