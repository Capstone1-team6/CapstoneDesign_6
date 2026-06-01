// components/common/Button.tsx
// 텍스트 버튼 — primary / pill / ghost.

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'pill' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  leadingIcon?: ReactNode;
}

export function Button({
  variant = 'primary', children, leadingIcon, className, ...rest
}: Props) {
  const base =
    'inline-flex items-center gap-1.5 cursor-pointer transition-all ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ' +
    'disabled:opacity-40 disabled:cursor-not-allowed';

  const variants: Record<Variant, string> = {
    primary:
      'px-3.5 py-2.5 rounded-cd-md bg-brand-grad text-white font-semibold text-[13.5px] ' +
      'shadow-brand-glow hover:-translate-y-px active:translate-y-0 letter-spacing-tight',
    pill:
      'px-3.5 py-2 rounded-full bg-surface border border-line text-ink-2 ' +
      'text-[12.5px] font-medium hover:bg-canvas hover:border-brand-200 hover:text-brand-600',
    ghost:
      'px-3 py-2 rounded-cd-sm bg-transparent text-ink-2 text-[13px] hover:bg-canvas',
  };

  return (
    <button type="button" className={cn(base, variants[variant], className)} {...rest}>
      {leadingIcon}
      {children}
    </button>
  );
}
