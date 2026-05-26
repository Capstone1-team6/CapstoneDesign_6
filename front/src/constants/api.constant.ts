// constants/api.constant.ts
// API 베이스 URL · 엔드포인트 경로 · 타임아웃 상수

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export const CHAT_STREAM_TIMEOUT_MS = Number(
  import.meta.env.VITE_CHAT_STREAM_TIMEOUT_MS ?? 30_000,
);

export const ENDPOINTS = {
  /** POST — 메시지 전송 (SSE 스트리밍) */
  chat:        '/api/chat',
  /** GET — 대화 세션 목록 */
  historyList: '/api/history',
  /** GET / DELETE — 단일 세션 메시지 */
  historyDetail: (sessionId: string) => `/api/history/${sessionId}`,
  /** GET — 서비스 메타 정보 (lastCrawledAt 등) */
  meta:        '/api/meta',
} as const;

/** 클라이언트가 환경에 따라 mock SSE를 쓸지 결정하는 플래그 */
export const USE_MOCK_API =
  !import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_USE_MOCK === 'true';
