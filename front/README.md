# 청담 · 淸潭

> 경북대학교 공지사항 하이브리드 RAG 챗봇 — Frontend

일청담 분수의 맑은 물처럼, 출처 없는 답은 흘려보냅니다.
**"맑을 청 · 이야기 담"** — 환각 없는 RAG.

---

## 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 (선택)
cp .env.example .env.local
# 백엔드 없이 mock 사용 시: VITE_USE_MOCK=true 추가

# 3. 개발 서버
npm run dev
# → http://localhost:5173

# 4. 빌드 + 미리보기
npm run build
npm run preview

# 5. 타입 체크
npm run typecheck
```

---

## 폴더 구조 (PRD 준수)

```text
src/
├── pages/                       UI 조립만 (API 직접 호출 ❌)
│   ├── chat/ChatPage.tsx
│   ├── settings/SettingsPage.tsx
│   └── not-found/NotFoundPage.tsx
│
├── components/
│   ├── layout/    AppLayout · Header · Sidebar
│   ├── chat/      MessageBubble · MessageList · ChatInput
│   │              TypingIndicator · WelcomeScreen · AnnouncementCard
│   │              RAGPipeline · KnowledgeGraphModal · MiniGraph · SourcePreviewPanel
│   └── common/    Button · IconButton · Icon · Spinner · ErrorBoundary · CDLogo
│
├── hooks/         useChat · useChatHistory · useAnnouncements · useAutoScroll
├── api/           chat.api · history.api · announcement.api + mock/
├── store/         chatStore · sidebarStore (Zustand)
├── types/         message · chat · announcement · graph
├── constants/     api · chat · slang · graph
├── utils/         formatDate · groupByDate · replaceSlang · parseMarkdown · cn
├── lib/           axios
├── styles/        global.css
└── main.tsx
```

## 역할 분리 규칙

| 레이어 | 역할 | 제한 |
|---|---|---|
| `pages/` | 화면 단위, UI 조립 | API 직접 호출 ❌ |
| `components/` | 재사용 UI | 비즈니스 로직 ❌ |
| `hooks/` | 상태 + 로직 + API 호출 | — |
| `api/` | 서버 통신 | 네트워크 로직만 |
| `store/` | 전역 상태 (Zustand) | 비즈니스 로직 최소화 |
| `utils/` | 순수 함수 | 사이드 이펙트 ❌ |

## Mock SSE

`.env.local` 에 `VITE_USE_MOCK=true` 를 설정하면 `api/mock/mockChat.ts` 가 호출돼서, 백엔드 없이도 RAG 파이프라인·스트리밍·출처·후속 질문·지식 그래프가 동작합니다.

이 플래그를 설정하지 않으면 항상 실서버(`/api/chat`)로 요청합니다. 홈서버 직접 연결 시에는 `VITE_API_BASE_URL=http://<서버 IP>:8000` 을 함께 설정하세요.

## 구현 체크리스트 (PRD v3 매핑)

| ID | 기능 | 구현 위치 |
|---|---|---|
| F-INIT-01 | 로고 + 서비스 타이틀 | `components/layout/Header.tsx` + `CDLogo` |
| F-INIT-02 | 최신 동기화 시각 | `hooks/useAnnouncements.ts` |
| F-INIT-03 | 추천 질문 카드 | `components/chat/WelcomeScreen.tsx` |
| F-CHAT-01 | 대화 말풍선 | `components/chat/MessageBubble.tsx` |
| F-CHAT-02 | SSE 스트리밍 | `api/chat.api.ts` + `hooks/useChat.ts` |
| F-CHAT-03 | 로딩 인디케이터 | `RAGPipeline` + `TypingIndicator` |
| F-CHAT-04 | 답변 복사 | `MessageBubble` |
| F-CHAT-05 | 응답 중단 | `useChat.abort()` + AbortController |
| F-CHAT-06 | 멀티턴 | `chatStore.sessionId` |
| F-SRC-01 | 출처 아코디언 | `MessageBubble > SourcesSection` |
| F-SRC-02 | 출처 요약 카드 | `AnnouncementCard` |
| F-SRC-03 | 원문 이동 | `AnnouncementCard` 외부 링크 |
| F-INPUT-01~04 | 입력창 | `ChatInput` + `utils/replaceSlang.ts` |
| F-HIST-01~05 | 사이드바·히스토리 | `Sidebar` + `useChatHistory` |
| F-HIST-06 | 내 보관함 | `sidebarStore.bookmarks` |
| F-UX-01/02 | 자동 스크롤 | `useAutoScroll` |
| F-UX-03 | 인라인 에러 | `MessageBubble` (isError) |
| F-UX-04 | 재시도 | `useChat.retryLast` |
| F-UX-05 | 즐겨찾기 ★ | `sidebarStore.addBookmark` |
| F-UX-06 | 줄임말 치환 | `utils/replaceSlang.ts` |
| F-UX-07 | 반응형 | Tailwind `sm:` breakpoints |

## 추가 기능

- 🕸️ **지식 그래프** — 답변 옆 mini-map + 전체 모달 (`KnowledgeGraphModal`)
- 🔍 **출처 미리보기** — 인용 키워드 형광펜 강조 (`SourcePreviewPanel`)
- 💡 **후속 질문 추천** — 답변 아래 칩

## 라이선스

경북대학교 컴퓨터학부 종합프로젝트 6조.
