// types/graph.type.ts
// 지식 그래프 시각화용 도메인 모델

export type GraphNodeType = 'topic' | 'doc' | 'concept';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  /** 0..1 정규화 좌표 */
  x: number;
  y: number;
  /** 시각화 반지름 (정규화 단위) */
  r: number;
}

export type GraphEdge = [from: string, to: string];

export interface KnowledgeGraph {
  title: string;
  sub: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}
