// types/chat.type.ts
// 세션·히스토리·보관함 도메인 모델

import type { AnnouncementSource } from './announcement.type';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface BookmarkedMessage {
  messageId: string;
  sessionId: string;
  title: string;
  snippet: string;
  category?: string;
  sources?: AnnouncementSource[];
  bookmarkedAt: string;
}

/** GET /api/meta 응답 — 마지막 크롤링 시각 등 */
export interface MetaResponse {
  lastCrawledAt: string;
  totalAnnouncements: number;
}
