// types/announcement.type.ts
// 공지사항 출처(Source) 도메인 모델

export type AnnouncementCategory =
  | '학사' | '장학' | '취업' | '기숙사' | '행사' | '일반';

export interface AnnouncementSource {
  /** 공지 고유 ID */
  id: string;
  /** 카테고리 (학사·장학·취업 등) */
  category: AnnouncementCategory | string;
  /** 원문 제목 */
  title: string;
  /** 내용 첫 문장 (PRD v3 추가) — **bold** 마크다운 허용 */
  summary: string;
  /** 작성일 — "YYYY-MM-DD" */
  publishedAt: string;
  /** 원문 외부 URL */
  url: string;
  /** 본문 (미리보기용, 선택) */
  body?: string;
  /** 인용 하이라이트 키워드 (미리보기 강조용) */
  highlights?: string[];
}
