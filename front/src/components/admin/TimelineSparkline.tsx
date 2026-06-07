// components/admin/TimelineSparkline.tsx
// 최근 30일 일자별 공지 수 — SVG sparkline (외부 차트 없이).

import type { TimelinePoint } from '@/types/stats.type';

interface Props {
  points: TimelinePoint[];
}

const W = 720;
const H = 110;
const PAD = { l: 30, r: 12, t: 8, b: 22 };

export function TimelineSparkline({ points }: Props) {
  if (points.length === 0) {
    return (
      <div className="rounded-cd-lg border border-line bg-surface px-5 py-4">
        <h3 className="mb-2 text-[13px] font-semibold tracking-tight text-ink">
          최근 30일 수집 추이
        </h3>
        <div className="py-8 text-center text-[12px] text-ink-3">데이터 없음</div>
      </div>
    );
  }

  const max = Math.max(1, ...points.map((p) => p.count));
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const dx = innerW / Math.max(1, points.length - 1);
  const xy = (i: number, v: number) => [
    PAD.l + i * dx,
    PAD.t + innerH - (v / max) * innerH,
  ] as const;

  // 영역(area) 패스 + 선(line) 패스
  const linePath = points
    .map((p, i) => {
      const [x, y] = xy(i, p.count);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const areaPath = `${linePath} L${(PAD.l + (points.length - 1) * dx).toFixed(1)},${PAD.t + innerH} L${PAD.l},${PAD.t + innerH} Z`;

  // x축 라벨 — 처음/중간/끝 3개만
  const labelIdx = [0, Math.floor(points.length / 2), points.length - 1];

  const total = points.reduce((s, p) => s + p.count, 0);

  return (
    <div className="rounded-cd-lg border border-line bg-surface px-5 py-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[13px] font-semibold tracking-tight text-ink">
          최근 30일 수집 추이
        </h3>
        <span className="text-[11.5px] text-ink-3">총 {total}건</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        {/* y 가이드선 */}
        <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t} y2={PAD.t}
              stroke="currentColor" strokeWidth={0.5} className="text-line" />
        <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + innerH} y2={PAD.t + innerH}
              stroke="currentColor" strokeWidth={0.5} className="text-line" />
        {/* y 축 라벨 */}
        <text x={PAD.l - 6} y={PAD.t + 4} textAnchor="end" fontSize={10} className="fill-ink-3">
          {max}
        </text>
        <text x={PAD.l - 6} y={PAD.t + innerH + 3} textAnchor="end" fontSize={10}
              className="fill-ink-3">0</text>
        {/* area */}
        <path d={areaPath} className="fill-brand-500/15" />
        {/* line */}
        <path d={linePath} fill="none" strokeWidth={1.6}
              className="stroke-brand-500" strokeLinecap="round" strokeLinejoin="round" />
        {/* 데이터 점 (count > 0 인 곳만) */}
        {points.map((p, i) => {
          if (p.count === 0) return null;
          const [x, y] = xy(i, p.count);
          return <circle key={i} cx={x} cy={y} r={2.2} className="fill-brand-500" />;
        })}
        {/* x축 라벨 */}
        {labelIdx.map((i) => {
          const [x] = xy(i, 0);
          return (
            <text key={i} x={x} y={H - 6} textAnchor="middle"
                  fontSize={10} className="fill-ink-3">
              {points[i].date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
