// types/message.type.ts
// 메시지 + 스트리밍 청크 도메인 모델

import type { AnnouncementSource } from './announcement.type';
import type { KnowledgeGraph } from './graph.type';
import type { RetrievalDebug } from './retrieval.type';

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  sources?: AnnouncementSource[];
  /** 후속 질문 추천 */
  followups?: string[];
  /** 답변과 연결된 지식 그래프 키 (legacy, mock 호환용) */
  graphKey?: string;
  /** 백엔드에서 동적으로 받은 그래프 데이터 (graphKey 보다 우선) */
  graphData?: KnowledgeGraph;
  /** 검색 과정 디버그 — Vector/Graph raw + LLM 컨텍스트 */
  retrieval?: RetrievalDebug;
  createdAt: string;
  isError?: boolean;
  isBookmarked?: boolean;
  /** UI-only 플래그 — 스트리밍 중 */
  streaming?: boolean;
  /** UI-only 플래그 — RAG 파이프라인 로딩 중 */
  isLoading?: boolean;
}

/** SSE 스트림 청크 타입 */
export type StreamChunkType =
  | 'pipeline'      // 파이프라인 단계 변화 (crawl|retrieve|rerank|generate)
  | 'text'          // 본문 토큰
  | 'sources'       // 출처 카드 페이로드
  | 'followups'     // 후속 질문 추천
  | 'graph'         // 지식 그래프 키
  | 'retrieval'     // 검색 과정 디버그 (vector/graph/context)
  | 'session'       // 세션 ID 발급/확정
  | 'done'          // 스트림 종료
  | 'error';        // 에러

export interface StreamChunk {
  type: StreamChunkType;
  content?: string;
  sources?: AnnouncementSource[];
  followups?: string[];
  graphKey?: string;
  /** 백엔드에서 동적으로 보내는 그래프 데이터 */
  graphData?: KnowledgeGraph;
  /** retrieval 청크의 검색 과정 디버그 데이터 */
  retrieval?: RetrievalDebug;
  sessionId?: string;
  /** pipeline 청크일 때 단계 식별자 */
  step?: 'crawl' | 'retrieve' | 'rerank' | 'generate';
  error?: string;
}
