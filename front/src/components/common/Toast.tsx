import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface Props {
  message: string;
  show: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, show, onHide, duration = 2000 }: Props) {
  const onHideRef = useRef(onHide);

  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);
  
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => onHideRef.current(), duration);
    return () => clearTimeout(timer);
  }, [show, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed top-4 left-1/2 z-[60] -translate-x-1/2
                 transition-all duration-300
                 ${show ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
    >
      <div className="flex items-center gap-2 rounded-full bg-brand-grad px-4 py-2.5
                      text-[13px] font-medium text-white shadow-brand-glow">
        <Icon.Check className="text-white" />
        {message}
      </div>
    </div>
  );
}
