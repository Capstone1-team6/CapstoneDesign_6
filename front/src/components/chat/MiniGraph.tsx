// components/chat/MiniGraph.tsx
// 답변 옆 미니 지식 그래프 — 클릭 시 전체 모달.

import { Icon } from '@/components/common/Icon';
import { GRAPH_DATA } from '@/constants/graph.constant';

interface Props {
  graphKey: string;
  onExpand: () => void;
}

const W = 360, H = 110, PAD = 10;

export function MiniGraph({ graphKey, onExpand }: Props) {
  const data = GRAPH_DATA[graphKey] ?? GRAPH_DATA.general;
  const px = (x: number) => PAD + x * (W - 2 * PAD);
  const py = (y: number) => PAD + y * (H - 2 * PAD);

  return (
    <div className="mt-2 flex flex-col gap-1.5 rounded-cd-md border border-line bg-surface p-3.5">
      <div className="flex items-center justify-between text-[11.5px] font-semibold text-ink-3">
        <span className="flex items-center gap-1.5"><Icon.Graph /> 답변이 연결된 공지 지도</span>
        <button onClick={onExpand}
                className="border-0 bg-transparent text-[11px] text-brand-500 cursor-pointer">
          전체 보기 →
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
           className="block h-[110px] w-full">
        {data.edges.map(([a, b], i) => {
          const na = data.nodes.find((n) => n.id === a);
          const nb = data.nodes.find((n) => n.id === b);
          if (!na || !nb) return null;
          return (
            <line key={i} x1={px(na.x)} y1={py(na.y)} x2={px(nb.x)} y2={py(nb.y)}
                  stroke="#E3EAF4" strokeWidth={1} />
          );
        })}
        {data.nodes.map((n) => {
          const r = Math.max(4, n.r * 0.28);
          const fill   = n.type === 'topic' ? '#2563EB' : n.type === 'doc' ? '#B4D5F6' : '#E3EAF4';
          const stroke = n.type === 'topic' ? '#1E40AF' : '#7FB7EE';
          return <circle key={n.id} cx={px(n.x)} cy={py(n.y)} r={r}
                         fill={fill} stroke={stroke} strokeWidth={1} />;
        })}
      </svg>
    </div>
  );
}
