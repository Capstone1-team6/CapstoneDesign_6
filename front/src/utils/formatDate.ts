// utils/formatDate.ts
// 날짜 포맷 유틸 — 공지 게시일, 마지막 동기화 시각, 메시지 시각.

/** "2026.05.19. 02:00" 형식 — 동기화 표시용 */
export function formatSyncTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}.${m}.${day}. ${hh}:${mm}`;
}

/** "오전 11:24" 형식 — 메시지 타임스탬프 */
export function formatMessageTime(d: Date = new Date()): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = ((h + 11) % 12) + 1;
  return `${ampm} ${h12}:${pad(m)}`;
}

/** "오늘 / 어제 / 이전 7일 / 이전" 그룹 라벨 */
export function relativeDayGroup(iso: string | Date): '오늘' | '어제' | '이전 7일' | '이전' {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86_400_000);
  if (diffDays <= 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays <= 7) return '이전 7일';
  return '이전';
}

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}
