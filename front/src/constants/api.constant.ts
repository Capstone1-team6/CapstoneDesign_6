// constants/api.constant.ts
// API 베이스 URL · 엔드포인트 경로 · 타임아웃 상수

// 개발: 빈 문자열 → Vite proxy(/api → localhost:8000)로 상대 경로 사용
// 홈서버 배포: nginx 리버스 프록시 없이 직접 연결할 경우 .env.local에 설정
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? '';

const _parsedTimeout = Number(import.meta.env.VITE_CHAT_STREAM_TIMEOUT_MS);
export const CHAT_STREAM_TIMEOUT_MS =
  Number.isFinite(_parsedTimeout) && _parsedTimeout > 0 ? _parsedTimeout : 30_000;

export const ENDPOINTS = {
  /** POST — 메시지 전송 (SSE 스트리밍) */
  chat:        '/api/chat',
  /** GET — 대화 세션 목록 */
  historyList: '/api/history',
  /** GET / DELETE — 단일 세션 메시지 */
  historyDetail: (sessionId: string) => `/api/history/${sessionId}`,
  /** GET — 서비스 메타 정보 (lastCrawledAt 등) */
  meta:        '/api/meta',
  /** POST — 크롤러 트리거 (백그라운드 실행) */
  crawl:       '/api/crawl',
  /** GET — 크롤러 진행 상태 */
  crawlStatus: '/api/crawl/status',
  /** GET — 대시보드 통계 */
  stats:       '/api/stats',
  /** GET — 최근 크롤 로그 (ring buffer) */
  crawlLogs:   '/api/crawl/logs',
} as const;

/** VITE_USE_MOCK=true 로 명시해야만 mock 모드 활성화 */
export const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK === 'true';
