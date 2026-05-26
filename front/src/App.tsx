// App.tsx
// 라우팅이 별도 라이브러리 없이 간단해서 useState 한 줄로 토글.
// 추후 React Router 도입 시 `<Routes>` 로 교체하면 됨.

import { useState } from 'react';
import { ChatPage } from '@/pages/chat';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

type View = 'chat' | 'settings';

export function App() {
  const [view, setView] = useState<View>('chat');
  return (
    <ErrorBoundary>
      {view === 'chat' ? (
        <ChatPage onOpenSettings={() => setView('settings')} />
      ) : (
        <SettingsPage onClose={() => setView('chat')} />
      )}
    </ErrorBoundary>
  );
}
