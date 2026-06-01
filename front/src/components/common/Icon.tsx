// components/common/Icon.tsx
// 청담 — 사용처별 인라인 SVG 아이콘 세트.
// Lucide 스타일(1.5px stroke, round caps) — 패키지 의존 없이 직접 그림.

import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

const stroke = (children: React.ReactNode) =>
  function StrokeIcon(p: Props) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={16} height={16} viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
        {...p}
      >
        {children}
      </svg>
    );
  };

const filled = (children: React.ReactNode) =>
  function FillIcon(p: Props) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={16} height={16} viewBox="0 0 24 24"
        fill="currentColor" {...p}
      >
        {children}
      </svg>
    );
  };

export const Icon = {
  Plus:       stroke(<><path d="M12 5v14M5 12h14" /></>),
  Send:       stroke(<><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7Z" /></>),
  Stop:       filled(<rect x={6} y={6} width={12} height={12} rx={2} />),
  Search:     stroke(<><circle cx={11} cy={11} r={8} /><path d="m21 21-4.3-4.3" /></>),
  Menu:       stroke(<path d="M3 12h18M3 6h18M3 18h18" />),
  Settings:   stroke(<><circle cx={12} cy={12} r={3} /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
  Chat:       stroke(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />),
  Bookmark:   stroke(<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />),
  BookmarkFill: filled(<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />),
  Trash:      stroke(<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />),
  Copy:       stroke(<><rect x={9} y={9} width={13} height={13} rx={2} /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>),
  Check:      stroke(<path d="M20 6 9 17l-5-5" />),
  Chevron:    stroke(<path d="m9 18 6-6-6-6" />),
  Globe:      stroke(<><circle cx={12} cy={12} r={10} /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>),
  Graph:      stroke(<><circle cx={6} cy={6} r={2.5} /><circle cx={18} cy={7} r={2.5} /><circle cx={12} cy={18} r={2.5} /><path d="m8 7 8 0M7 8l4 8M17 9l-4 8" /></>),
  Share:      stroke(<><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1={12} y1={2} x2={12} y2={15} /></>),
  External:   stroke(<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1={10} y1={14} x2={21} y2={3} /></>),
  Sparkle:    filled(<path d="M12 2 13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z" />),
  Calendar:   stroke(<><rect x={3} y={4} width={18} height={18} rx={2} /><line x1={16} y1={2} x2={16} y2={6} /><line x1={8} y1={2} x2={8} y2={6} /><line x1={3} y1={10} x2={21} y2={10} /></>),
  Cap:        stroke(<><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1 4 3 6 3s6-2 6-3v-5" /></>),
  Coin:       stroke(<><circle cx={12} cy={12} r={9} /><path d="M12 7v10M9 10h4.5a2 2 0 1 1 0 4H9" /></>),
  Home:       stroke(<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>),
  Doc:        stroke(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1={9} y1={13} x2={15} y2={13} /></>),
  X:          stroke(<path d="M18 6 6 18M6 6l12 12" />),
  User:       stroke(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx={12} cy={7} r={4} /></>),
  Refresh:    stroke(<><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>),
  ArrowLeft:  stroke(<path d="m15 18-6-6 6-6" />),
  BotDrop:    filled(<path d="M12 4 C9 8 6 11 6 15 a6 6 0 0 0 12 0 c0 -4 -3 -7 -6 -11 z" />),
} as const;

export type IconName = keyof typeof Icon;
