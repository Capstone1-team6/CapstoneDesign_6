// api/mock/mockHistory.ts
// 데모용 히스토리·세션 상세 응답.

import type { ChatSession } from '@/types/chat.type';
import type { Message } from '@/types/message.type';

const HOUR = 3_600_000;
const DAY = 86_400_000;

const now = Date.now();
const iso = (offset: number) => new Date(now - offset).toISOString();

export function mockHistory(): Promise<ChatSession[]> {
  const sessions: ChatSession[] = [
    {
      id: 'h-1',
      title: '졸업 요건 관련 질문',
      createdAt: iso(2 * HOUR),
      updatedAt: iso(2 * HOUR),
      messageCount: 4,
    },
    {
      id: 'h-2',
      title: '국가장학금 2학기 신청',
      createdAt: iso(1 * DAY),
      updatedAt: iso(1 * DAY),
      messageCount: 2,
    },
    {
      id: 'h-3',
      title: '복수전공 신청 방법',
      createdAt: iso(1 * DAY + 3 * HOUR),
      updatedAt: iso(1 * DAY + 3 * HOUR),
      messageCount: 3,
    },
    {
      id: 'h-4',
      title: '계절학기 수강신청',
      createdAt: iso(5 * DAY),
      updatedAt: iso(5 * DAY),
      messageCount: 5,
    },
    {
      id: 'h-5',
      title: '학생증 재발급 절차',
      createdAt: iso(7 * DAY),
      updatedAt: iso(7 * DAY),
      messageCount: 2,
    },
  ];
  return Promise.resolve(sessions);
}

export function mockSessionDetail(_sessionId: string): Promise<Message[]> {
  // 데모용 — 비어 있는 세션 (실 구현 시 서버에서 메시지 반환)
  return Promise.resolve([]);
}
