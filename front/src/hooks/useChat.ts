// hooks/useChat.ts
// 메시지 전송 + 스트리밍 청크 라우팅 + 중단(abort).
// (PRD F-CHAT-02 / F-CHAT-05 / F-INPUT-04 / F-UX-04)

import { useCallback, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { sendChat } from '@/api/chat.api';
import { replaceSlang, isEmptyInput } from '@/utils/replaceSlang';
import { formatMessageTime } from '@/utils/formatDate';
import type { Message, StreamChunk } from '@/types/message.type';
import { ROLE } from '@/constants/chat.constant';

export function useChat() {
  const {
    addMessage, updateMessage, removeMessage, appendStreamChunk, finalizeStream,
    setStreaming, setRagStep, setSessionId, setAbortController, setLastUserMessage,
    isStreaming, abortController,
  } = useChatStore();

  // 청크가 매번 setState로 들어오면 React 18 batching이 알아서 묶어줌
  const send = useCallback(
    async (text: string, questionId?: string) => {
      if (isEmptyInput(text)) return;
      if (useChatStore.getState().isStreaming) return;

      // FE 단 줄임말 치환 (사용자에게 노출 안 함)
      const normalized = replaceSlang(text);

      const userId = 'u-' + Date.now();
      const userMsg: Message = {
        id: userId,
        role: ROLE.USER,
        content: text,
        createdAt: formatMessageTime(),
      };
      addMessage(userMsg);
      setLastUserMessage(text);

      // 로딩 버블 — RAG 파이프라인 인디케이터
      const loadingId = 'a-loading-' + Date.now();
      addMessage({
        id: loadingId,
        role: ROLE.ASSISTANT,
        content: '',
        createdAt: '',
        isLoading: true,
      });

      // AbortController 등록
      const ctrl = new AbortController();
      setAbortController(ctrl);
      setStreaming(true);
      setRagStep(0);

      const assistantId = 'a-' + Date.now();
      let assistantBornYet = false;
      let acc = '';

      try {
        await sendChat({
          sessionId: useChatStore.getState().sessionId,
          message: normalized,
          signal: ctrl.signal,
          // mock 라우터에 추천 카드 ID 힌트를 전달하려면 클로저로 외부 변수 캡쳐
          // (실 서버에서는 무시)
          // @ts-expect-error — questionId는 mock 전용 비표준 필드
          questionId,
          onChunk: (chunk: StreamChunk) => routeChunk(chunk),
        });
      } catch (err) {
        const isAbort = (err as Error)?.name === 'AbortError';
        if (!isAbort) {
          // 인라인 에러 메시지 — F-UX-03
          updateMessage(assistantBornYet ? assistantId : loadingId, {
            isLoading: false,
            streaming: false,
            content:
              (assistantBornYet ? acc : '') +
              '\n\n❌ 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.',
            isError: true,
          });
        }
      } finally {
        setStreaming(false);
        setRagStep(0);
        setAbortController(null);
      }

      function routeChunk(chunk: StreamChunk) {
        switch (chunk.type) {
          case 'pipeline': {
            const idx = ['crawl', 'retrieve', 'rerank', 'generate'].indexOf(chunk.step!);
            setRagStep(idx + 1);
            return;
          }
          case 'text': {
            if (!assistantBornYet) {
              // 첫 토큰 — 로딩 버블을 실제 답변 버블로 전환
              removeMessage(loadingId);
              addMessage({
                id: assistantId,
                role: ROLE.ASSISTANT,
                content: '',
                createdAt: '',
                streaming: true,
              });
              assistantBornYet = true;
            }
            acc += chunk.content ?? '';
            appendStreamChunk(assistantId, chunk.content ?? '');
            return;
          }
          case 'sources':
            updateMessage(assistantId, { sources: chunk.sources });
            return;
          case 'followups':
            updateMessage(assistantId, { followups: chunk.followups });
            return;
          case 'graph':
            updateMessage(assistantId, {
              graphKey: chunk.graphKey,
              graphData: chunk.graphData,
            });
            return;
          case 'retrieval':
            updateMessage(assistantId, { retrieval: chunk.retrieval });
            return;
          case 'session':
            if (chunk.sessionId) setSessionId(chunk.sessionId);
            return;
          case 'done':
            finalizeStream(assistantId, {});
            updateMessage(assistantId, { createdAt: formatMessageTime() });
            return;
          case 'error':
            throw new Error(chunk.error ?? 'unknown stream error');
        }
      }
    },
    [
      addMessage, updateMessage, removeMessage, appendStreamChunk, finalizeStream,
      setStreaming, setRagStep, setSessionId, setAbortController, setLastUserMessage,
    ],
  );

  const abort = useCallback(() => {
    abortController?.abort();
    setStreaming(false);
    setRagStep(0);
  }, [abortController, setStreaming, setRagStep]);

  /** 마지막 사용자 메시지를 다시 전송 — 에러 재시도용 (F-UX-04) */
  const retryLast = useCallback(() => {
    const last = useChatStore.getState().lastUserMessage;
    if (last) void send(last);
  }, [send]);

  return { send, abort, retryLast, isStreaming };
}
