// constants/chat.constant.ts
// 챗봇 UI 상수 — 예시 질문, 역할 식별자, RAG 파이프라인 단계 등

import type { MessageRole } from '@/types/message.type';

export const ROLE: Record<'USER' | 'ASSISTANT', MessageRole> = {
  USER:      'user',
  ASSISTANT: 'assistant',
} as const;

/** 웰컴 화면 추천 질문 카드 (Cold Start 도메인 빈출 질의) */
export const EXAMPLE_QUESTIONS: ReadonlyArray<{
  id: string;
  icon: 'Calendar' | 'Coin' | 'Cap' | 'Home';
  title: string;
  hint: string;
}> = [
  { id: 'q-courses',     icon: 'Calendar', title: '2026학년도 1학기 수강신청 일정 알려줘', hint: '학사 · 일정' },
  { id: 'q-scholarship', icon: 'Coin',     title: '국가장학금 2학기 신청 방법은?',        hint: '장학 · 신청절차' },
  { id: 'q-graduation',  icon: 'Cap',      title: '컴퓨터학부 졸업 요건 알려줘',           hint: '학사 · 졸업' },
  { id: 'q-dorm',        icon: 'Home',     title: '기숙사 신청은 어떻게 해?',              hint: '생활 · 기숙사' },
] as const;

/** RAG 파이프라인 단계 — 로딩 인디케이터에 1:1 표시 */
export type RagStepId = 'crawl' | 'retrieve' | 'rerank' | 'generate';

export const RAG_STEPS: ReadonlyArray<{
  id: RagStepId;
  label: string;
  tag: string;
}> = [
  { id: 'crawl',    label: '학교 홈페이지에서 최신 공지를 찾는 중',  tag: 'crawl' },
  { id: 'retrieve', label: '관련 문서를 검색해 컨텍스트를 모으는 중', tag: 'retrieve' },
  { id: 'rerank',   label: '문서 신뢰도를 비교하며 정렬하는 중',     tag: 'rerank' },
  { id: 'generate', label: '근거를 바탕으로 답변을 작성하는 중',     tag: 'generate' },
] as const;

/** 메시지 타이핑 효과 — 청크 사이 지연 (ms) */
export const STREAM_CHUNK_DELAY_MS = { min: 22, max: 52 } as const;

/** 입력창 최대 줄 높이 (px) */
export const COMPOSER_MAX_HEIGHT_PX = 130;

/** 자동 스크롤 일시정지 임계값 (px) */
export const AUTO_SCROLL_THRESHOLD_PX = 120;
