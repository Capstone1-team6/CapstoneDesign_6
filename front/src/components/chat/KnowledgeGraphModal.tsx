// components/chat/KnowledgeGraphModal.tsx
// 전체 지식 그래프 모달 — 노드 hover 강조, topic 펄스 링.

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { IconButton } from '@/components/common/IconButton';
import { GRAPH_DATA } from '@/constants/graph.constant';

interface Props {
  graphKey: string;
  onClose: () => void;
}

export function KnowledgeGraphModal({ graphKey, onClose }: Props) {
  const data = GRAPH_DATA[graphKey] ?? GRAPH_DATA.general;
  const [hovered, setHovered] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    if (!canvasRef.current) return;
    const update = () => {
      const r = canvasRef.current!.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const px = (x: number) => 60 + x * (size.w - 120);
  const py = (y: number) => 60 + y * (size.h - 120);

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="kg-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center
                 bg-ink/50 p-8 backdrop-blur-sm"
    >
      <div className="flex h-[min(720px,100%)] w-full max-w-[980px] flex-col
                      overflow-hidden rounded-cd-xl bg-surface shadow-cd-lg animate-scale-in">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex flex-col leading-tight">
            <b id="kg-modal-title" className="text-[15.5px] font-semibold text-ink">{data.title}</b>
            <span className="mt-0.5 text-[12px] text-ink-3">
              {data.sub} · 답변의 근거가 된 공지와 개념의 관계망
            </span>
          </div>
          <IconButton aria-label="닫기" onClick={onClose}><Icon.X /></IconButton>
        </div>

        <div ref={canvasRef}
             className="relative flex-1 overflow-hidden"
             style={{ background: 'radial-gradient(circle at 50% 50%, #EDF6FE 0%, #FFFFFF 70%)' }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${size.w} ${size.h}`}
               className="absolute inset-0 block">
            <defs>
              <radialGradient id="kgrad-topic">
                <stop offset="0%" stopColor="#5BAEDC"/>
                <stop offset="100%" stopColor="#2563EB"/>
              </radialGradient>
              <radialGradient id="kgrad-doc">
                <stop offset="0%" stopColor="#DBEAFB"/>
                <stop offset="100%" stopColor="#7FB7EE"/>
              </radialGradient>
              <radialGradient id="kgrad-concept">
                <stop offset="0%" stopColor="#F8FBFE"/>
                <stop offset="100%" stopColor="#E3EAF4"/>
              </radialGradient>
              <filter id="kshadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {data.edges.map(([a, b], i) => {
              const na = data.nodes.find((n) => n.id === a);
              const nb = data.nodes.find((n) => n.id === b);
              if (!na || !nb) return null;
              const isLit = hovered && (hovered === a || hovered === b);
              return (
                <line
                  key={i}
                  x1={px(na.x)} y1={py(na.y)} x2={px(nb.x)} y2={py(nb.y)}
                  stroke={isLit ? '#4F95E3' : '#E3EAF4'}
                  strokeWidth={isLit ? 2 : 1.2}
                  strokeDasharray={(na.type === 'concept' || nb.type === 'concept') ? '4 4' : undefined}
                  opacity={hovered && !isLit ? 0.3 : 1}
                  style={{ transition: 'all 200ms' }}
                />
              );
            })}

            {data.nodes.map((n) => {
              const r = n.r;
              const fill = n.type === 'topic' ? 'url(#kgrad-topic)'
                : n.type === 'doc' ? 'url(#kgrad-doc)' : 'url(#kgrad-concept)';
              const dim = hovered && hovered !== n.id;
              return (
                <g key={n.id}
                   onMouseEnter={() => setHovered(n.id)}
                   onMouseLeave={() => setHovered(null)}
                   style={{ cursor: 'pointer', opacity: dim ? 0.4 : 1, transition: 'opacity 200ms' }}>
                  {n.type === 'topic' && (
                    <circle cx={px(n.x)} cy={py(n.y)} r={r + 14}
                            fill="none" stroke="#7FB7EE" strokeWidth={1}
                            opacity={hovered === n.id ? 0.6 : 0.25}>
                      <animate attributeName="r" from={r + 6} to={r + 18}
                               dur="2.4s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" from="0.45" to="0"
                               dur="2.4s" repeatCount="indefinite"/>
                    </circle>
                  )}
                  <circle cx={px(n.x)} cy={py(n.y)} r={r}
                          fill={fill}
                          stroke={n.type === 'topic' ? '#1E40AF' : n.type === 'doc' ? '#4F95E3' : '#B4D5F6'}
                          strokeWidth={1.5}
                          filter={n.type === 'topic' ? 'url(#kshadow)' : undefined} />
                  {n.type === 'topic' && (
                    <text x={px(n.x)} y={py(n.y) + 4}
                          fontSize="13" fontWeight={700} textAnchor="middle" fill="white">
                      {n.label}
                    </text>
                  )}
                  {n.type !== 'topic' && (
                    <text x={px(n.x)} y={py(n.y) + r + 16} fontSize="11.5"
                          fontWeight={n.type === 'doc' ? 600 : 500} textAnchor="middle"
                          fill={n.type === 'doc' ? '#0B1B3D' : '#56678A'}>
                      {n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 rounded-cd-md border
                          border-line bg-white/85 px-3.5 py-2.5 text-[11.5px] text-ink-3 backdrop-blur-sm">
            <Legend dot="bg-brand-500" label="주제 (Topic)" />
            <Legend dot="bg-brand-200" label="공지 문서 (Document)" />
            <Legend dot="bg-line border border-brand-200" label="개념 (Concept)" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`block h-2.5 w-2.5 rounded-full ${dot}`} />
      {label}
    </div>
  );
}
