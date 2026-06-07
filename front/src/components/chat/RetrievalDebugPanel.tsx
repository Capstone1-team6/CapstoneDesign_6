// components/chat/RetrievalDebugPanel.tsx
// 검색 과정 확인 패널 — Vector / Graph / LLM 컨텍스트 3탭.
// 답변 메시지 하단 토글로 펼치는 인라인 패널 (별도 라우팅 X).

import { useState } from 'react';
import { Icon } from '@/components/common/Icon';
import type { RetrievalDebug } from '@/types/retrieval.type';
import { cn } from '@/utils/cn';

interface Props {
  data: RetrievalDebug;
}

type Tab = 'vector' | 'graph' | 'context';

export function RetrievalDebugPanel({ data }: Props) {
  const [tab, setTab] = useState<Tab>('vector');

  const counts: Record<Tab, number> = {
    vector: data.vector.length,
    graph: data.graph.length,
    context: data.contextLength,
  };

  return (
    <div className="mt-2 overflow-hidden rounded-cd-md border border-line bg-surface-2">
      {/* 탭 헤더 */}
      <div className="flex items-center justify-between border-b border-line-2 px-3 py-2">
        <div className="flex items-center gap-1">
          {(['vector', 'graph', 'context'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'flex items-center gap-1 rounded-md border-0 px-2.5 py-1 text-[11.5px] font-medium',
                'cursor-pointer transition-colors',
                tab === t
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-transparent text-ink-3 hover:bg-canvas',
              )}
            >
              <span>{TAB_LABEL[t]}</span>
              <span className={cn(
                'rounded-full px-1.5 text-[10px]',
                tab === t ? 'bg-brand-100 text-brand-700' : 'bg-line text-ink-3',
              )}>
                {t === 'context' ? `${counts[t]}자` : counts[t]}
              </span>
            </button>
          ))}
        </div>
        <span className="flex items-center gap-1 text-[10.5px] text-ink-4">
          <Icon.Sparkle /> 답변 근거 투명 공개
        </span>
      </div>

      {/* 탭 본문 */}
      <div className="max-h-[360px] overflow-y-auto px-3 py-3">
        {tab === 'vector' && <VectorTab items={data.vector} />}
        {tab === 'graph' && <GraphTab items={data.graph} />}
        {tab === 'context' && <ContextTab content={data.context} total={data.contextLength} />}
      </div>
    </div>
  );
}

const TAB_LABEL: Record<Tab, string> = {
  vector: 'Vector 결과',
  graph: 'Graph 결과',
  context: 'LLM 컨텍스트',
};

function VectorTab({ items }: { items: RetrievalDebug['vector'] }) {
  if (items.length === 0) {
    return <div className="py-6 text-center text-[12px] text-ink-3">Vector 검색 결과 없음</div>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((v, i) => (
        <li key={v.chunkId || i}
            className="flex flex-col gap-1 rounded-cd-md border border-line bg-surface px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="line-clamp-1 text-[12px] font-medium text-ink-2">
              <span className="mr-1.5 text-brand-500">[{i + 1}]</span>
              {v.source || '(출처 미상)'}
            </span>
            {typeof v.score === 'number' && (
              <span className="flex-shrink-0 rounded-full bg-brand-50 px-2 py-[2px]
                               text-[10.5px] font-semibold text-brand-700">
                score {v.score.toFixed(3)}
              </span>
            )}
          </div>
          <p className="line-clamp-3 whitespace-pre-wrap text-[11.5px] leading-snug text-ink-3">
            {v.preview || '(빈 본문)'}
          </p>
          {v.chunkId && (
            <span className="font-mono text-[10px] text-ink-4">{v.chunkId}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function GraphTab({ items }: { items: RetrievalDebug['graph'] }) {
  if (items.length === 0) {
    return <div className="py-6 text-center text-[12px] text-ink-3">Graph 관계 없음</div>;
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((g, i) => (
        <li key={i} className="flex items-center gap-2 rounded-cd-md border border-line
                                bg-surface px-3 py-2 text-[12px]">
          <span className="font-medium text-ink-2">{g.from}</span>
          <span className="flex items-center gap-1 text-ink-4">
            <span>—[</span>
            <span className="rounded bg-brand-50 px-1.5 py-px text-[10.5px] font-semibold
                             text-brand-700">{g.relation || '관계'}</span>
            <span>]→</span>
          </span>
          <span className="font-medium text-ink-2">{g.to}</span>
        </li>
      ))}
    </ul>
  );
}

function ContextTab({ content, total }: { content: string; total: number }) {
  if (!content) {
    return <div className="py-6 text-center text-[12px] text-ink-3">컨텍스트 없음</div>;
  }
  const truncated = total > content.length;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[10.5px] text-ink-4">
        <span>LLM 에 전달된 raw 컨텍스트</span>
        <span>
          {content.length.toLocaleString()}자
          {truncated && ` / 원본 ${total.toLocaleString()}자 (앞부분만 표시)`}
        </span>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-cd-md
                      border border-line bg-surface p-3 font-mono text-[11px]
                      leading-relaxed text-ink-2">
        {content}
      </pre>
    </div>
  );
}
