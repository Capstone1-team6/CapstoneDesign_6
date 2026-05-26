// hooks/useAutoScroll.ts
// 스트리밍 중 자동 최하단 스크롤. 사용자가 위로 100px+ 이동하면 일시정지.
// (PRD F-UX-01 / F-UX-02)

import { useEffect, useRef } from 'react';
import { AUTO_SCROLL_THRESHOLD_PX } from '@/constants/chat.constant';

interface Options {
  /** 외부 의존성 — 메시지 배열·스트리밍 플래그 등을 넣으면 변할 때마다 스크롤 시도 */
  deps: ReadonlyArray<unknown>;
}

export function useAutoScroll<T extends HTMLElement>({ deps }: Options) {
  const ref = useRef<T | null>(null);
  const pausedRef = useRef(false);

  // 사용자가 위로 스크롤하면 자동 추적 일시 정지
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      pausedRef.current = distFromBottom > AUTO_SCROLL_THRESHOLD_PX;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // 의존성 변화 → 추적 활성 시 최하단으로
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (pausedRef.current) return;
    el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
