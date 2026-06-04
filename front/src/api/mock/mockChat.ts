// api/mock/mockChat.ts
// 실서버 미배포 시 SSE를 흉내내는 데모 스트림.
// `USE_MOCK_API === true` 일 때 `sendChat`이 이걸 호출.

import type { StreamChunk } from '@/types/message.type';
import { CANNED_RESPONSES, guessCannedKey } from './cannedResponses';
import { STREAM_CHUNK_DELAY_MS } from '@/constants/chat.constant';

interface MockParams {
  message: string;
  signal: AbortSignal;
  onChunk: (c: StreamChunk) => void;
  /** 추천 카드 클릭 시 강제로 매핑할 질의 ID */
  questionId?: string;
}

const PIPELINE_DELAYS = { crawl: 700, retrieve: 900, rerank: 700, generate: 600 } as const;

export async function mockChatStream({
  message,
  signal,
  onChunk,
  questionId,
}: MockParams): Promise<void> {
  // 1. 파이프라인 단계 — 각 단계 도착을 청크로 알림
  for (const step of ['crawl', 'retrieve', 'rerank', 'generate'] as const) {
    if (signal.aborted) return;
    onChunk({ type: 'pipeline', step });
    await wait(PIPELINE_DELAYS[step], signal);
  }
  if (signal.aborted) return;

  // 2. 응답 본문 결정 — 추천 카드 ID 우선, 없으면 자연어 추정
  const key = questionId ?? guessCannedKey(message);
  const canned = CANNED_RESPONSES[key] ?? CANNED_RESPONSES.__default__;

  // 3. 본문 토큰 스트림
  for (const chunk of splitForStreaming(canned.content)) {
    if (signal.aborted) return;
    onChunk({ type: 'text', content: chunk });
    await wait(rand(STREAM_CHUNK_DELAY_MS.min, STREAM_CHUNK_DELAY_MS.max), signal);
  }

  // 4. 출처 · 후속 질문 · 그래프 · 세션 ID · 종료
  onChunk({ type: 'sources',   sources: canned.sources });
  onChunk({ type: 'followups', followups: canned.followups });
  onChunk({ type: 'graph',     graphKey: canned.graphKey });
  onChunk({ type: 'session',   sessionId: 'sess_' + Math.random().toString(36).slice(2, 10) });
  onChunk({ type: 'done' });
}

function splitForStreaming(text: string): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const isBreak = /[\s,.\n]/.test(text[i]);
    const n = isBreak ? 1 : 1 + Math.floor(Math.random() * 3);
    chunks.push(text.slice(i, i + n));
    i += n;
  }
  return chunks;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('aborted', 'AbortError'));
    }, { once: true });
  });
}
