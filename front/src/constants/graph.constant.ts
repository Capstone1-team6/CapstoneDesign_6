// constants/graph.constant.ts
// 데모용 지식 그래프 데이터 — 답변별 노드/엣지.
// 실 구현 시 BE에서 받아오게 되면 `api/graph.api.ts` 로 이동.

import type { KnowledgeGraph } from '@/types/graph.type';

export const GRAPH_DATA: Record<string, KnowledgeGraph> = {
  courses: {
    title: '수강신청 관련 지식 그래프',
    sub: '관련 공지 4건 · 연결된 개념 6개',
    nodes: [
      { id: 'topic', label: '수강신청', type: 'topic',   x: 0.50, y: 0.45, r: 30 },
      { id: 'd1',    label: '1학기 수강신청 안내', type: 'doc', x: 0.22, y: 0.22, r: 18 },
      { id: 'd2',    label: '수강정정 안내',       type: 'doc', x: 0.78, y: 0.22, r: 16 },
      { id: 'd3',    label: '계절학기 안내',       type: 'doc', x: 0.85, y: 0.55, r: 15 },
      { id: 'd4',    label: '시간표 공지',         type: 'doc', x: 0.15, y: 0.62, r: 14 },
      { id: 'c1',    label: '학년별 일정', type: 'concept', x: 0.36, y: 0.78, r: 12 },
      { id: 'c2',    label: '포털 접속',  type: 'concept', x: 0.62, y: 0.82, r: 12 },
      { id: 'c3',    label: '폐강 기준',  type: 'concept', x: 0.92, y: 0.78, r: 11 },
    ],
    edges: [
      ['topic', 'd1'], ['topic', 'd2'], ['topic', 'd3'], ['topic', 'd4'],
      ['topic', 'c1'], ['topic', 'c2'], ['d2', 'c3'], ['d1', 'c1'], ['d1', 'c2'],
    ],
  },
  scholarship: {
    title: '장학금 관련 지식 그래프',
    sub: '관련 공지 5건 · 연결된 개념 7개',
    nodes: [
      { id: 'topic', label: '장학금',     type: 'topic',   x: 0.50, y: 0.50, r: 32 },
      { id: 'd1',    label: '국가장학금 2학기', type: 'doc', x: 0.20, y: 0.28, r: 18 },
      { id: 'd2',    label: '교내 가계곤란',    type: 'doc', x: 0.80, y: 0.28, r: 16 },
      { id: 'd3',    label: '근로장학생',       type: 'doc', x: 0.20, y: 0.72, r: 15 },
      { id: 'd4',    label: '성적우수 장학',   type: 'doc', x: 0.80, y: 0.72, r: 16 },
      { id: 'c1',    label: '가구원 동의', type: 'concept', x: 0.35, y: 0.12, r: 11 },
      { id: 'c2',    label: '서류 제출',  type: 'concept', x: 0.65, y: 0.12, r: 11 },
      { id: 'c3',    label: '한국장학재단', type: 'concept', x: 0.12, y: 0.50, r: 12 },
    ],
    edges: [
      ['topic', 'd1'], ['topic', 'd2'], ['topic', 'd3'], ['topic', 'd4'],
      ['d1', 'c1'], ['d1', 'c2'], ['d1', 'c3'], ['d2', 'c2'],
    ],
  },
  graduation: {
    title: '졸업 요건 지식 그래프',
    sub: '관련 공지 3건 · 연결된 개념 5개',
    nodes: [
      { id: 'topic', label: '졸업 요건', type: 'topic', x: 0.50, y: 0.50, r: 32 },
      { id: 'd1',    label: '졸업요건 안내', type: 'doc', x: 0.25, y: 0.25, r: 17 },
      { id: 'd2',    label: '졸업 사정',     type: 'doc', x: 0.75, y: 0.25, r: 15 },
      { id: 'c1',    label: '130학점',      type: 'concept', x: 0.20, y: 0.65, r: 14 },
      { id: 'c2',    label: '전공 72학점',  type: 'concept', x: 0.50, y: 0.85, r: 13 },
      { id: 'c3',    label: 'TOEIC 700',    type: 'concept', x: 0.80, y: 0.65, r: 12 },
      { id: 'c4',    label: '코딩 인증',    type: 'concept', x: 0.88, y: 0.40, r: 11 },
    ],
    edges: [
      ['topic', 'd1'], ['topic', 'd2'], ['topic', 'c1'], ['topic', 'c2'],
      ['topic', 'c3'], ['topic', 'c4'], ['d1', 'c1'], ['d1', 'c2'],
    ],
  },
  dorm: {
    title: '기숙사 관련 지식 그래프',
    sub: '관련 공지 2건 · 연결된 개념 4개',
    nodes: [
      { id: 'topic', label: '생활관',   type: 'topic',   x: 0.50, y: 0.50, r: 30 },
      { id: 'd1',    label: '2학기 입사 안내', type: 'doc', x: 0.22, y: 0.28, r: 18 },
      { id: 'd2',    label: '사생비 납부 안내', type: 'doc', x: 0.78, y: 0.28, r: 15 },
      { id: 'c1',    label: '선발 기준', type: 'concept', x: 0.20, y: 0.72, r: 12 },
      { id: 'c2',    label: '룸타입',    type: 'concept', x: 0.50, y: 0.85, r: 11 },
      { id: 'c3',    label: '입사일',    type: 'concept', x: 0.80, y: 0.72, r: 11 },
    ],
    edges: [
      ['topic', 'd1'], ['topic', 'd2'], ['topic', 'c1'], ['topic', 'c2'],
      ['topic', 'c3'], ['d1', 'c1'], ['d1', 'c2'], ['d2', 'c3'],
    ],
  },
  general: {
    title: '관련 지식 그래프',
    sub: '연관 공지 2건',
    nodes: [
      { id: 'topic', label: '학사 일정',     type: 'topic',   x: 0.50, y: 0.50, r: 28 },
      { id: 'd1',    label: '학사 일정 안내', type: 'doc',     x: 0.25, y: 0.30, r: 16 },
      { id: 'd2',    label: '학사 공지',     type: 'doc',     x: 0.75, y: 0.30, r: 14 },
    ],
    edges: [['topic', 'd1'], ['topic', 'd2']],
  },
};
