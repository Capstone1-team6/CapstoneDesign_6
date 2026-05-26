// lib/axios.ts
// 공용 axios 인스턴스 — baseURL·timeout·인터셉터 설정.

import axios from 'axios';
import { API_BASE_URL, CHAT_STREAM_TIMEOUT_MS } from '@/constants/api.constant';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: CHAT_STREAM_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 — 로깅·인증 토큰 부착 자리
http.interceptors.request.use((config) => {
  // TODO: auth 토큰 부착
  return config;
});

// 응답 인터셉터 — 공통 에러 메시지 정규화
http.interceptors.response.use(
  (res) => res,
  (err) => {
    // TODO: 토스트 등 글로벌 에러 처리
    return Promise.reject(err);
  },
);
