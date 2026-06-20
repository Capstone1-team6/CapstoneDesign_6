// 메시지 전송 + 스트리밍 청크 라우팅 + 중단(abort).

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
          // @ts-expect-error — questionId는 mock 전용 비표준 필드
          questionId,
          onChunk: (chunk: StreamChunk) => routeChunk(chunk),
        });
      } catch (err) {
        const isAbort = (err as Error)?.name === 'AbortError';
        if (!isAbort) {
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

    const messages = useChatStore.getState().messages;
    const pending = [...messages].reverse().find((m) => m.isLoading || m.streaming);
    if (pending) {
      if (pending.isLoading && !pending.content) {
        updateMessage(pending.id, {
          isLoading: false,
          streaming: false,
          isStopped: true,
          content: '답변 생성이 중지되었습니다.',
          createdAt: formatMessageTime(),
        });
      } else {
        updateMessage(pending.id, { isLoading: false, streaming: false });
      }
    }

    setStreaming(false);
    setRagStep(0);
  }, [abortController, removeMessage, updateMessage, setStreaming, setRagStep]);

  const retryLast = useCallback(() => {
    const last = useChatStore.getState().lastUserMessage;
    if (last) void send(last);
  }, [send]);

  return { send, abort, retryLast, isStreaming };
}
