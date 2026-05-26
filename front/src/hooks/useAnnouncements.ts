// hooks/useAnnouncements.ts
// 마지막 동기화 시각 등 공지 메타 정보 조회.

import { useEffect, useState } from 'react';
import { fetchMeta } from '@/api/announcement.api';
import type { MetaResponse } from '@/types/chat.type';

export function useAnnouncements() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMeta()
      .then((m) => { if (alive) setMeta(m); })
      .catch((e: Error) => { if (alive) setError(e); });
    return () => { alive = false; };
  }, []);

  return { meta, error };
}
