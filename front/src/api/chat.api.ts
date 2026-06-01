// api/chat.api.ts
// 챗봇 메시지 전송 — SSE 스트리밍 인터페이스.
// 실서버 미배포 시 USE_MOCK_API=true 면 `mockChatStream` 사용.

import { http } from '@/lib/axios';
import { ENDPOINTS, USE_MOCK_API } from '@/constants/api.constant';
import type { StreamChunk } from '@/types/message.type';
import { mockChatStream } from './mock/mockChat';

export interface SendChatParams {
  sessionId: string | null;
  message: string;
  signal: AbortSignal;
  /** 청크가 도착할 때마다 호출 */
  onChunk: (chunk: StreamChunk) => void;
}

/**
 * POST /api/chat — SSE 스트림.
 *
 * 서버 구현(=실제 POST)이 없을 때는 mock 스트림으로 대체.
 * 클라이언트는 항상 같은 인터페이스(`onChunk`)를 통해 청크를 받음.
 */
export async function sendChat(params: SendChatParams): Promise<void> {
  if (USE_MOCK_API) {
    await mockChatStream(params);
    return;
  }
  await realChatStream(params);
}

async function realChatStream({
  sessionId,
  message,
  signal,
  onChunk,
}: SendChatParams): Promise<void> {
  // fetch + ReadableStream — axios는 SSE 본문 스트림을 직접 노출하지 않음
  const res = await fetch(http.defaults.baseURL + ENDPOINTS.chat, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ sessionId, message }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error('chat stream failed: ' + res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    // SSE 프레임은 빈 줄로 구분
    let idx: number;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const data = parseSSEFrame(frame);
      if (data) onChunk(data);
    }
  }
}

function parseSSEFrame(frame: string): StreamChunk | null {
  // "event: chunk\ndata: { ... }"
  const dataLine = frame.split('\n').find((l) => l.startsWith('data:'));
  if (!dataLine) return null;
  try {
    return JSON.parse(dataLine.replace(/^data:\s*/, '')) as StreamChunk;
  } catch {
    return null;
  }
}
