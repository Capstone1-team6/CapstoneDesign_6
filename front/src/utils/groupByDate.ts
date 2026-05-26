// utils/groupByDate.ts
// 히스토리(ChatSession[])를 날짜별 그룹으로 묶는 순수 함수

import type { ChatSession } from '@/types/chat.type';
import { relativeDayGroup } from './formatDate';

export type HistoryGroup = '오늘' | '어제' | '이전 7일' | '이전';

const GROUP_ORDER: HistoryGroup[] = ['오늘', '어제', '이전 7일', '이전'];

export function groupByDate(
  sessions: ChatSession[],
): Array<{ group: HistoryGroup; items: ChatSession[] }> {
  const buckets: Record<HistoryGroup, ChatSession[]> = {
    '오늘': [], '어제': [], '이전 7일': [], '이전': [],
  };
  for (const s of sessions) {
    buckets[relativeDayGroup(s.updatedAt)].push(s);
  }
  // 각 그룹 내부 최신순
  for (const g of GROUP_ORDER) {
    buckets[g].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  return GROUP_ORDER
    .filter((g) => buckets[g].length > 0)
    .map((g) => ({ group: g, items: buckets[g] }));
}
