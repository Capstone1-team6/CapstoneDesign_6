// utils/cn.ts
// className 결합 헬퍼 — clsx 얇은 래퍼.

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
