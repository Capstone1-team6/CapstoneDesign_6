// components/admin/StatCard.tsx
// 큰 숫자 1개 + 라벨 + 보조 텍스트 — KPI 카드.

import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: number | string;
  sub?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, sub, icon }: Props) {
  return (
    <div className="flex flex-col gap-1.5 rounded-cd-lg border border-line bg-surface px-5 py-4">
      <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-wider
                      text-ink-3">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-[28px] font-bold leading-none tracking-tight text-ink">{value}</div>
      {sub && <div className="text-[12px] text-ink-3">{sub}</div>}
    </div>
  );
}
