// pages/settings/SettingsPage.tsx
// 설정 페이지 — 알림·동기화·출처 정책 등.

import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { Icon } from '@/components/common/Icon';
import { CDLogo } from '@/components/common/CDLogo';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { formatSyncTime } from '@/utils/formatDate';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { triggerSync, fetchSyncStatus } from '@/api/sync.api';

interface Props {
  onClose: () => void;
}

export function SettingsPage({ onClose }: Props) {
  const { meta } = useAnnouncements();
  const [pref, setPref] = useState({
    notifyImportant: true,
    notifyDaily: false,
    blockUnsourced: true,
  });

  const [syncRunning, setSyncRunning] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // 백엔드 진행 상태를 5초마다 폴링 (실행 중일 때만)
  useEffect(() => {
    if (!syncRunning) return;
    const id = setInterval(async () => {
      try {
        const { running, lastError, message } = await fetchSyncStatus();
        setSyncMsg(lastError ? `동기화 실패: ${lastError}` : message);
        if (!running) {
          setSyncRunning(false);
        }
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(id);
  }, [syncRunning]);

  const handleSync = async () => {
    if (syncRunning) return;
    setSyncMsg(null);
    try {
      await triggerSync(3);
      setSyncRunning(true);
      setSyncMsg('전체 동기화 시작됨 - 크롤링, 파싱, 검색 DB 반영을 진행합니다.');
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } };
      setSyncMsg(err?.response?.data?.detail ?? '동기화 시작 실패');
    }
  };

  return (
    <div className="flex h-screen flex-col bg-canvas font-sans text-ink">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-line bg-white/70
                      px-6 py-3.5 backdrop-blur-md">
        <IconButton aria-label="뒤로가기" onClick={onClose}>
          <Icon.ArrowLeft />
        </IconButton>
        <CDLogo size="sm" />
        <h1 className="m-0 text-[18px] font-semibold tracking-tight">설정</h1>
      </div>

      <div className="mx-auto w-full max-w-[720px] flex-1 overflow-y-auto px-8 pb-12 pt-8">
        <SettingsGroup label="계정">
          <SettingsRow
            title="경북대 재학생"
            sub="student@knu.ac.kr · 컴퓨터학부 4학년"
            leading={
              <div className="flex h-11 w-11 items-center justify-center rounded-full
                              bg-gradient-to-br from-brand-100 to-brand-400 font-semibold text-white">
                경
              </div>
            }
            right={<Button variant="pill">로그아웃</Button>}
          />
        </SettingsGroup>

        <SettingsGroup label="알림">
          <SettingsRow
            title="중요 공지 알림"
            sub="즐겨찾기한 주제에 새 공지가 올라오면 알려드려요"
            right={
              <Toggle
                title="중요 공지 알림"
                on={pref.notifyImportant}
                onClick={() => setPref((p) => ({ ...p, notifyImportant: !p.notifyImportant }))}
              />
            }
          />
          <SettingsRow
            title="매일 학사 일정 요약"
            sub="오전 8시에 그날의 마감일·일정 한 줄 요약"
            right={
              <Toggle
                title="매일 학사 일정 요약"
                on={pref.notifyDaily}
                onClick={() => setPref((p) => ({ ...p, notifyDaily: !p.notifyDaily }))}
              />
            }
          />
        </SettingsGroup>

        <SettingsGroup label="데이터 · 출처">
          <SettingsRow
            title="크롤링 도메인"
            sub="knu.ac.kr · cs.knu.ac.kr · dorm.knu.ac.kr 외 4개"
            right={<Button variant="pill">관리</Button>}
          />
          <SettingsRow
            title="마지막 동기화"
            sub={
              syncMsg
                ? syncMsg
                : `${meta ? formatSyncTime(meta.lastCrawledAt) : '—'} · 자동 (매일 새벽 2시)`
            }
            right={
              <Button
                variant="pill"
                leadingIcon={<Icon.Refresh />}
                onClick={handleSync}
                disabled={syncRunning}
              >
                {syncRunning ? '검색 DB 반영 중...' : '지금 동기화'}
              </Button>
            }
          />
          <SettingsRow
            title="출처 없는 답변 차단"
            sub='근거가 부족하면 "모른다"라고 답해요 (권장)'
            right={
              <Toggle
                title="출처 없는 답변 차단"
                on={pref.blockUnsourced}
                onClick={() => setPref((p) => ({ ...p, blockUnsourced: !p.blockUnsourced }))}
              />
            }
          />
        </SettingsGroup>

        <SettingsGroup label="청담 정보">
          <SettingsRow
            title="청담 · v0.3.0 (beta)"
            sub='"맑을 청 · 이야기 담" — 일청담 분수의 맑음처럼, 환각 없는 RAG'
            leading={<CDLogo size="sm" animated={false} />}
          />
        </SettingsGroup>

        <div className="px-4 pb-2 pt-6 text-center text-[11.5px] text-ink-4">
          Made by 6조 · 경북대학교 컴퓨터학부 종합프로젝트
        </div>
      </div>
    </div>
  );
}

function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 overflow-hidden rounded-cd-lg border border-line bg-surface">
      <div className="border-b border-line-2 px-5 pb-2.5 pt-3.5 text-[11.5px] font-semibold uppercase
                      tracking-wider text-ink-3">{label}</div>
      {children}
    </div>
  );
}

function SettingsRow({
  title, sub, leading, right,
}: {
  title: string;
  sub?: string;
  leading?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line-2 px-5 py-4 last:border-b-0">
      <div className="flex items-center gap-3">
        {leading}
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium text-ink">{title}</span>
          {sub && <span className="text-[12px] text-ink-3">{sub}</span>}
        </div>
      </div>
      {right}
    </div>
  );
}

function Toggle({ on, onClick, title }: { on: boolean; onClick: () => void; title: string }) {
  return (
    <button
      type="button" aria-pressed={on} aria-label={title} onClick={onClick}
      className={cn(
        'relative h-[22px] w-[38px] flex-shrink-0 rounded-full border-0 p-0 transition-colors',
        on ? 'bg-brand-500' : 'bg-line',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm',
          'transition-transform',
          on && 'translate-x-4',
        )}
      />
    </button>
  );
}
