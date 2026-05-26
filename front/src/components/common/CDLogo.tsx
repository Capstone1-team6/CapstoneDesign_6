// components/common/CDLogo.tsx
// 청담 로고 — 물방울 + 잔물결 + 별 모티프.
// variant: 'drop-ripple' (기본) | 'star-drop' | 'cheong'

import { cn } from '@/utils/cn';

export type LogoVariant = 'drop-ripple' | 'star-drop' | 'cheong';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  variant?: LogoVariant;
  animated?: boolean;
  className?: string;
}

const SIZE_CLASS = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-24 h-24' };

export function CDLogo({
  size = 'md', variant = 'drop-ripple', animated = true, className,
}: Props) {
  const cls = cn('inline-flex items-center justify-center relative', SIZE_CLASS[size], className);

  if (variant === 'cheong') {
    return (
      <span className={cls}>
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <defs>
            <linearGradient id="cd-cheong-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5BAEDC" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="14" fill="url(#cd-cheong-grad)" />
          <text x="24" y="33" fontSize="26" fontWeight={700} textAnchor="middle"
                fill="white" fontFamily="Pretendard, sans-serif">청</text>
        </svg>
      </span>
    );
  }

  if (variant === 'star-drop') {
    return (
      <span className={cls}>
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <defs>
            <linearGradient id="cd-star-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5BAEDC" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="14" fill="url(#cd-star-grad)" />
          <path d="M24 12 C19 19 16 23 16 28 a8 8 0 0 0 16 0 c0 -5 -3 -9 -8 -16 z"
                fill="white" opacity={0.95} />
          <g transform="translate(33 17)">
            <path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="white" />
          </g>
        </svg>
      </span>
    );
  }

  // 기본: drop-ripple
  return (
    <span className={cls}>
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <defs>
          <linearGradient id="cd-drop-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5BAEDC" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="cd-drop-inner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="14" fill="url(#cd-drop-grad)" />
        {animated && (
          <>
            <circle cx="24" cy="26" r="9" fill="none" stroke="white"
                    strokeWidth="1.2" opacity={0.7}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center',
                             animation: 'cd-ripple 3.6s ease-out infinite' }} />
            <circle cx="24" cy="26" r="9" fill="none" stroke="white"
                    strokeWidth="1.2" opacity={0.7}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center',
                             animation: 'cd-ripple 3.6s ease-out 1.8s infinite' }} />
          </>
        )}
        <path d="M24 11 C19 18 15.5 22.5 15.5 28 a8.5 8.5 0 0 0 17 0 c0 -5.5 -3.5 -10 -8.5 -17 z"
              fill="url(#cd-drop-inner)" />
        <ellipse cx="21" cy="26" rx="2" ry="3.2" fill="white" opacity={0.55} />
        <g transform="translate(34 14)" opacity={0.9}>
          <path d="M0 -3 L0.7 -0.7 L3 0 L0.7 0.7 L0 3 L-0.7 0.7 L-3 0 L-0.7 -0.7 Z" fill="white" />
        </g>
      </svg>
    </span>
  );
}
