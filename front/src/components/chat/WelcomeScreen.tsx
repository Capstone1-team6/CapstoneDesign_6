// components/chat/WelcomeScreen.tsx
// 첫 진입 시 안내 + 추천 질문 카드 4종 (PRD F-INIT-03).

import { CDLogo } from '@/components/common/CDLogo';
import { Icon, type IconName } from '@/components/common/Icon';
import { EXAMPLE_QUESTIONS } from '@/constants/chat.constant';

interface Props {
  onPick: (q: { id: string; title: string }) => void;
}

export function WelcomeScreen({ onPick }: Props) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[820px] min-h-full flex-col items-center
                      justify-center px-6 pb-6 pt-10 text-center">
      <div className="mb-5"><CDLogo size="lg" /></div>
      <h1 className="m-0 mb-2.5 text-[32px] font-bold leading-tight tracking-tight text-ink">
        무엇이 궁금하세요?
      </h1>
      <p className="mb-9 m-0 max-w-[540px] text-[15px] leading-relaxed text-ink-3"
         style={{ textWrap: 'pretty' }}>
        경북대학교 공지사항을 <b className="font-semibold text-brand-600">청담</b>이 실시간으로 찾아드려요.<br />
        일청담의 맑은 물처럼, 출처 없는 답은 흘려보냅니다.
      </p>

      <div className="grid w-full max-w-[660px] grid-cols-1 gap-3 sm:grid-cols-2">
        {EXAMPLE_QUESTIONS.map((q) => {
          const Ico = Icon[q.icon as IconName] ?? Icon.Search;
          return (
            <button
              key={q.id}
              onClick={() => onPick({ id: q.id, title: q.title })}
              className="group flex items-start gap-3 rounded-cd-md border border-line
                         bg-surface p-4 text-left transition-all
                         hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-cd-md"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center
                               rounded-cd-sm bg-brand-50 text-brand-600">
                <Ico />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[14px] font-semibold leading-snug text-ink"
                      style={{ textWrap: 'pretty' }}>{q.title}</span>
                <span className="text-[12px] text-ink-3">{q.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}
