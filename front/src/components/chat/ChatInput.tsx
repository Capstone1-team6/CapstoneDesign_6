// components/chat/ChatInput.tsx
// 입력창 — 자동 높이 (최대 130px), Shift+Enter 줄바꿈, 빈 입력 차단.
// 스트리밍 중에는 ■ 중단 버튼으로 토글.

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { COMPOSER_MAX_HEIGHT_PX } from '@/constants/chat.constant';
import { isEmptyInput } from '@/utils/replaceSlang';
import { cn } from '@/utils/cn';

interface Props {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onAbort: () => void;
}

export function ChatInput({ isStreaming, onSend, onAbort }: Props) {
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // 자동 높이 조절
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT_PX) + 'px';
  }, [value]);

  const submit = () => {
    if (isEmptyInput(value) || isStreaming) return;
    onSend(value);
    setValue('');
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const disabled = isEmptyInput(value);

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-5 pt-3.5 sm:px-6">
      <div className="flex items-end gap-2.5 rounded-[18px] border-[1.5px] border-line
                      bg-surface py-2.5 pl-4 pr-2.5 transition-all
                      focus-within:border-brand-300
                      focus-within:shadow-[0_0_0_4px_rgba(91,174,220,0.12)]">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder="청담에게 학교 공지사항을 물어보세요"
          disabled={isStreaming}
          className="min-h-6 flex-1 resize-none border-0 bg-transparent py-2 text-[14.5px]
                     leading-relaxed text-ink outline-none placeholder:text-ink-4
                     disabled:opacity-60"
          style={{ maxHeight: COMPOSER_MAX_HEIGHT_PX }}
          aria-label="질문 입력"
        />
        {isStreaming ? (
          <button
            type="button" onClick={onAbort} aria-label="응답 중단"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center
                       rounded-[12px] bg-ink-2 text-white shadow-brand-glow"
          >
            <Icon.Stop width={14} height={14} />
          </button>
        ) : (
          <button
            type="button" onClick={submit} disabled={disabled} aria-label="전송"
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px]',
              'bg-brand-grad text-white shadow-brand-glow transition-transform',
              'hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100',
            )}
          >
            <Icon.Send width={18} height={18} />
          </button>
        )}
      </div>
      <div className="mt-2 text-center text-[11px] text-ink-4">
        <b className="font-semibold text-ink-3">Shift+Enter</b>로 줄바꿈, <b className="font-semibold text-ink-3">Enter</b>로 전송 ·
        청담은 출처가 있는 답변만 드려요
      </div>
    </div>
  );
}
