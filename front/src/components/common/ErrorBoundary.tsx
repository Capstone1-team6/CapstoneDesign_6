// components/common/ErrorBoundary.tsx
// 컴포넌트 트리 에러 폴백.

import { Component, type ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8 text-center">
        <div className="text-[15px] font-semibold text-ink">화면을 그리는 중 문제가 발생했어요.</div>
        <div className="text-[13px] text-ink-3 max-w-md">
          {this.state.error?.message ?? '알 수 없는 오류가 발생했습니다.'}
        </div>
        <Button onClick={() => location.reload()}>새로고침</Button>
      </div>
    );
  }
}
