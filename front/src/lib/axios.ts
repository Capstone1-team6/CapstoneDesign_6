// lib/axios.ts
// 공용 axios 인스턴스 — baseURL·timeout·인터셉터 설정.

import axios from 'axios';
import { API_BASE_URL } from '@/constants/api.constant';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 — 공통 요청 옵션 확장 지점
http.interceptors.request.use((config) => {
  return config;
});

// 응답 인터셉터 — 공통 에러 메시지 정규화
http.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err);
  },
);
