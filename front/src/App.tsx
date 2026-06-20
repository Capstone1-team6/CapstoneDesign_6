// App.tsx
// 라우팅이 별도 라이브러리 없이 간단해서 useState 한 줄로 토글.
// 추후 React Router 도입 시 `<Routes>` 로 교체하면 됨.

import { useEffect, useState } from 'react';
import { ChatPage } from '@/pages/chat';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { DashboardPage } from '@/pages/admin';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

type View = 'chat' | 'settings' | 'admin';

const VIEW_STORAGE_KEY = 'cheongdam:view';

function getInitialView(): View {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(VIEW_STORAGE_KEY) : null;
  return saved === 'settings' || saved === 'admin' ? saved : 'chat';
}

export function App() {
  const [view, setView] = useState<View>(getInitialView);

  // 새로고침해도 설정/관리자 화면에 머물러 있도록 마지막 화면을 저장.
  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const goChat = () => setView('chat');
  return (
    <ErrorBoundary>
      {view === 'chat' && (
        <ChatPage
          onOpenSettings={() => setView('settings')}
          onOpenAdmin={() => setView('admin')}
        />
      )}
      {view === 'settings' && <SettingsPage onClose={goChat} />}
      {view === 'admin' && <DashboardPage onClose={goChat} />}
    </ErrorBoundary>
  );
}
