// components/common/Spinner.tsx
// 잔물결 모티프 스피너 — 동심원 회전.

import { cn } from '@/utils/cn';

interface Props {
  size?: number;
  className?: string;
}

export function Spinner({ size = 16, className }: Props) {
  const s = size + 'px';
  return (
    <svg
      width={s} height={s} viewBox="0 0 24 24"
      className={cn('animate-spin text-brand-500', className)}
      xmlns="http://www.w3.org/2000/svg"
      role="status" aria-label="로딩 중"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"
              fill="none" strokeDasharray="42 14" opacity="0.85" />
    </svg>
  );
}
