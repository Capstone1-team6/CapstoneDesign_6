// components/admin/LatestNoticesList.tsx
// 최근 수집된 공지 N건 — 누락 검증용.

import { Icon } from '@/components/common/Icon';
import type { LatestNotice } from '@/types/stats.type';

interface Props {
  notices: LatestNotice[];
}

const CAT_COLOR: Record<string, string> = {
  '학사':   'bg-brand-50 text-brand-700',
  '장학':   'bg-amber-50 text-amber-900',
  '취업':   'bg-emerald-50 text-emerald-800',
  '행사':   'bg-pink-50 text-pink-800',
  '기숙사': 'bg-violet-50 text-violet-800',
  '국제':   'bg-cyan-50 text-cyan-800',
  '기타':   'bg-canvas text-ink-3',
};

export function LatestNoticesList({ notices }: Props) {
  return (
    <div className="flex flex-col rounded-cd-lg border border-line bg-surface">
      <div className="border-b border-line-2 px-5 py-3">
        <h3 className="text-[13px] font-semibold tracking-tight text-ink">
          최근 수집 공지 ({notices.length}건)
        </h3>
      </div>
      {notices.length === 0 ? (
        <div className="py-10 text-center text-[12px] text-ink-3">데이터 없음</div>
      ) : (
        <ul className="flex flex-col">
          {notices.map((n) => (
            <li key={n.num} className="border-b border-line-2 px-5 py-3 last:border-b-0">
              <div className="flex items-start gap-3">
                <span className={
                  `flex-shrink-0 rounded-full px-2 py-[3px] text-[10.5px] font-semibold ${
                    CAT_COLOR[n.category] ?? CAT_COLOR['기타']
                  }`
                }>
                  {n.category}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <a href={n.url} target="_blank" rel="noopener noreferrer"
                     className="line-clamp-1 text-[13.5px] font-medium text-ink no-underline
                                hover:text-brand-600">
                    {n.title}
                  </a>
                  <div className="flex items-center gap-3 text-[11.5px] text-ink-3">
                    <span>{n.date}</span>
                    <span className="text-ink-4">·</span>
                    <span>#{n.num}</span>
                    {n.attachmentCount > 0 && (
                      <>
                        <span className="text-ink-4">·</span>
                        <span className="flex items-center gap-1">
                          <Icon.Doc /> 첨부 {n.attachmentCount}개
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
