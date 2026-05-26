// pages/not-found/NotFoundPage.tsx
// 404 폴백 화면.

import { CDLogo } from '@/components/common/CDLogo';
import { Button } from '@/components/common/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas
                    px-6 text-center font-sans">
      <CDLogo size="lg" />
      <h1 className="text-[28px] font-bold tracking-tight text-ink">길을 잃었어요</h1>
      <p className="max-w-md text-[14px] leading-relaxed text-ink-3">
        찾으시는 페이지가 없어요. 일청담의 물도 가끔은 길을 헷갈리거든요.
      </p>
      <Button onClick={() => (location.href = '/')}>홈으로 돌아가기</Button>
    </div>
  );
}
