// utils/replaceSlang.ts
// 사용자 입력에 등장한 캠퍼스 줄임말을 공식 명칭으로 일괄 치환
// (PRD F-UX-06) — 검색 임베딩 품질 저하 방지를 위한 FE 파이프라인 단

import { SLANG_MAP } from '@/constants/slang.constant';

export function replaceSlang(input: string, map: Record<string, string> = SLANG_MAP): string {
  let out = input;
  // 긴 키부터 치환해서 부분 매칭 충돌 방지
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    out = out.split(k).join(map[k]);
  }
  return out;
}

/** 입력이 빈 상태(공백·줄바꿈만 포함)인지 — F-INPUT-04 */
export function isEmptyInput(s: string): boolean {
  return /^\s*$/.test(s);
}
