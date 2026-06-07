// types/retrieval.type.ts
// 검색 과정 디버그 데이터 — 답변 근거(컨텍스트) 투명 공개용.

export interface VectorResultItem {
  chunkId: string;
  source: string;
  score: number | null;
  preview: string;        // 본문 첫 ~300자
}

export interface GraphResultItem {
  from: string;
  relation: string;
  to: string;
}

export interface RetrievalDebug {
  vector: VectorResultItem[];
  graph: GraphResultItem[];
  context: string;          // LLM 에 전달된 raw 컨텍스트 (앞 8000자)
  contextLength: number;    // 잘리기 전 원본 길이
}
