// components/common/IconButton.tsx
// 아이콘 전용 버튼 — aria-label 강제.

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 스크린리더용 — 필수 */
  'aria-label': string;
  children: ReactNode;
  size?: 'sm' | 'md';
}

export function IconButton({ children, className, size = 'md', ...rest }: Props) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-cd-sm',
        'bg-transparent border-none text-ink-2 cursor-pointer',
        'transition-colors hover:bg-line-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
        size === 'sm' ? 'w-7 h-7' : 'w-9 h-9',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
