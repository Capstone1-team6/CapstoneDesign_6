# 청담 (淸潭) — 경북대 공지사항 Hybrid RAG 챗봇

> *"맑을 청 · 이야기 담"* — 일청담 분수의 맑음처럼, 환각 없는 RAG.

경북대학교 컴퓨터학부 공지사항·규정·매뉴얼을 기반으로 학생 질문에 답변하는 **Hybrid RAG (Retrieval-Augmented Generation)** 시스템입니다.

벡터 검색(ChromaDB)과 지식 그래프(Neo4j)를 결합하여, 단순 키워드 매칭으로는 어려운 조건 해석·다문서 결합형 질문까지 처리합니다. 본 시스템은 **챗봇 웹 서비스 + 관리자 모니터링 대시보드 + 답변 근거 투명 공개 패널** 3축으로 구성됩니다.

---

## 목차

1. [전체 아키텍처](#전체-아키텍처)
2. [주요 기능](#주요-기능)
3. [프론트엔드](#프론트엔드)
4. [백엔드 API](#백엔드-api)
5. [전처리 파이프라인](#전처리-파이프라인)
6. [Hybrid RAG 엔진](#hybrid-rag-엔진)
7. [평가 시스템](#평가-시스템)
8. [설치 및 실행](#설치-및-실행)
9. [배포 (홈서버 / Docker)](#배포-홈서버--docker)
10. [환경 변수 레퍼런스](#환경-변수-레퍼런스)
11. [디렉토리 구조](#디렉토리-구조)
12. [주요 설계 결정 및 Ablation 결과](#주요-설계-결정-및-ablation-결과)
13. [변경 이력](#변경-이력)

---

## 전체 아키텍처

```
┌────────────────────────────────────────────────────────────────────┐
│  사용자 브라우저                                                   │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────┐    │
│  │ 챗봇 UI      │  │ 관리자 대시보드 │  │ 검색 과정 확인 패널 │    │
│  │ (Chat)       │  │ (Admin)        │  │ (Retrieval Debug)   │    │
│  └──────────────┘  └────────────────┘  └──────────────────────┘    │
│                          Vite + React + Tailwind                   │
└────────────────────────────────────────────────────────────────────┘
                                  │  /api/*  (SSE / REST)
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│  FastAPI 백엔드 (backend/)                                         │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ /api/chat    │  │ /api/history  │  │ /api/meta  │  │ /api/    │ │
│  │ (SSE 스트림) │  │ (세션 CRUD)   │  │ /stats     │  │ crawl    │ │
│  └──────┬───────┘  └───────┬───────┘  └─────┬──────┘  └────┬─────┘ │
│         │                  │                │              │       │
│         ▼                  ▼                ▼              ▼       │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ RAG service  │  │ SQLite 세션   │  │ notices.   │  │ Pipeline │ │
│  │ (04_hybrid…) │  │ + 메시지 영속  │  │ json 집계  │  │ 0/1/2/3  │ │
│  │  + 그래프    │  │  retrieval_   │  │            │  │  서브프  │ │
│  │  레이아웃    │  │  json 포함    │  │            │  │  로세스  │ │
│  └──────┬───────┘  └───────────────┘  └────────────┘  └──────────┘ │
└─────────┼──────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────────────┐
│  데이터/지식 저장소                                                │
│  ┌──────────────────┐  ┌───────────────────┐  ┌────────────────┐   │
│  │ ChromaDB         │  │ Neo4j (Docker)    │  │ data/raw,      │   │
│  │ (벡터 인덱스)    │  │ Document/Chunk/   │  │ data/attachments│  │
│  │ Upstage 임베딩   │  │ Entity 3계층      │  │ data/parsed    │   │
│  │ chunk_id 1:1    ⇄  │ chunk_id 브리지   │  │                │   │
│  └──────────────────┘  └───────────────────┘  └────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

`chunk_id` 가 ChromaDB와 Neo4j 양쪽에서 동일하게 사용되어 **VectorDB ↔ GraphDB 브리지** 역할을 합니다.

---

## 주요 기능

### ① 챗봇 인터페이스
- 자연어 질의 입력 → Hybrid RAG 답변 (SSE 스트리밍)
- 답변 하단 출처 카드 (공지 제목·작성일·원문 URL) → 클릭 시 우측 슬라이드 패널로 본문 미리보기
- 좌측 사이드바: 대화 히스토리 + 보관함 (북마크)

### ② 지식 그래프 시각화
- 답변 메시지 옆 미니 그래프 (관련 공지·개념 토픽 노드 시각화)
- 헤더 그래프 버튼 → 전체 모달로 확장 (`KnowledgeGraphModal`)
- 백엔드 `hybrid_rag.graph_relations` 를 ring 레이아웃으로 변환해서 동적 표시

### ③ 데이터 수집 모니터링 대시보드 (관리자 화면)
- KPI: 총 공지 수, 총 첨부파일, 현재 단계, 카테고리 수
- 최근 30일 수집 추이 sparkline
- 카테고리별 분포 막대 (키워드 기반 자동 분류: 학사 / 장학 / 취업 / 행사 / 기숙사 / 국제)
- 실시간 동기화 로그 스트림 (단계별 컬러 뱃지: 크롤 → 첨부 → 파싱 → 벡터 → 그래프 → 리로드)
- 최근 수집 공지 10건 리스트 + 원문 링크
- 헤더 우측 🔄 아이콘에서 진입

### ④ 검색 결과/컨텍스트 확인 패널
- 답변 하단 "🔍 검색 과정 보기" 토글 → 3탭 디버그 패널
  - **Vector 결과**: chunk 카드 (출처 파일명, score, 본문 미리보기)
  - **Graph 결과**: `from --[relation]→ to` triple 리스트
  - **LLM 컨텍스트**: 생성 모델에 전달된 raw 컨텍스트 monospace 박스
- 과거 대화도 클릭하면 검색 과정 그대로 복원됨 (DB `retrieval_json` 컬럼 영속화)

### ⑤ 자동 동기화 파이프라인
- 설정 페이지 "지금 동기화" 버튼 → `POST /api/crawl` (X-Sync-Token 인증)
- 백그라운드 실행: **crawl → download → parse → vector(증분) → graph(증분) → cache reload**
- 단계별 상태가 `GET /api/crawl/status` 와 `GET /api/crawl/logs` 로 노출되어 대시보드에서 모니터링 가능

---

## 프론트엔드

`front/` (Vite 5 + React 18 + TypeScript + Tailwind 3 + Zustand)

### 디렉토리

```
front/src/
├── pages/
│   ├── chat/             # ChatPage — 메인 챗봇 화면
│   ├── admin/            # DashboardPage — ③ 데이터 수집 모니터링
│   ├── settings/         # SettingsPage — 동기화 / 알림 / 정책 토글
│   └── not-found/
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx
│   │   ├── MessageList.tsx / MessageBubble.tsx
│   │   ├── AnnouncementCard.tsx          # 출처 카드
│   │   ├── SourcePreviewPanel.tsx        # 우측 슬라이드 본문 패널
│   │   ├── MiniGraph.tsx                 # 답변 옆 미니 그래프
│   │   ├── KnowledgeGraphModal.tsx       # 전체 그래프 모달
│   │   ├── RetrievalDebugPanel.tsx       # ④ 3탭 디버그 패널
│   │   ├── RAGPipeline.tsx               # 단계 인디케이터
│   │   └── WelcomeScreen.tsx
│   ├── admin/
│   │   ├── StatCard.tsx                  # KPI 카드
│   │   ├── CategoryBars.tsx              # 카테고리 막대
│   │   ├── TimelineSparkline.tsx         # 30일 sparkline (인라인 SVG)
│   │   ├── CrawlLogStream.tsx            # 실시간 로그
│   │   └── LatestNoticesList.tsx
│   ├── layout/   (Header, Sidebar)
│   └── common/   (Button, Icon, IconButton, CDLogo, ErrorBoundary, ...)
├── hooks/        (useChat, useChatHistory, useAnnouncements, useStats, useAutoScroll)
├── api/          (chat.api.ts, history.api.ts, announcement.api.ts, sync.api.ts, stats.api.ts)
├── store/        (chatStore.ts, sidebarStore.ts — Zustand)
├── types/        (message / announcement / graph / retrieval / chat / stats)
└── constants/    (api.constant.ts, chat.constant.ts, graph.constant.ts)
```

### SSE 청크 타입 (`/api/chat` 응답)

| 타입 | 페이로드 | 용도 |
|---|---|---|
| `session` | `sessionId` | 신규 세션 ID 발급 |
| `text` | `content` | 답변 본문 |
| `sources` | `sources[]` | 출처 카드 |
| `graph` | `graphData` (`KnowledgeGraph`) | 지식 그래프 노드/엣지 |
| `retrieval` | `retrieval` (vector + graph + context) | 검색 과정 디버그 |
| `done` / `error` | — | 종료 / 에러 |

순서: `session → text → sources → graph → retrieval → done`

### 개발 서버

```bash
cd front
npm install
npm run dev     # http://localhost:5173 (Vite proxy → 백엔드 :8000)
```

`VITE_USE_MOCK=true` 로 백엔드 없이 mock 데이터로 UI 동작 확인 가능.

---

## 백엔드 API

`backend/` (FastAPI + SQLModel + SQLite)

### 엔드포인트

| Method | Path | 설명 |
|---|---|---|
| `POST` | `/api/chat` | 챗봇 답변 (SSE 스트리밍, 6종 청크) |
| `GET` | `/api/history` | 세션 목록 |
| `GET` | `/api/history/{session_id}` | 세션 메시지 |
| `DELETE` | `/api/history/{session_id}` | 세션 삭제 |
| `GET` | `/api/meta` | 마지막 동기화 시각 + 총 공지 수 |
| `GET` | `/api/stats` | 대시보드 통계 (총 공지/첨부, 카테고리, 30일 타임라인, 최신 10건) |
| `POST` | `/api/crawl` | 풀 동기화 트리거 (`X-Sync-Token` 인증, 백그라운드 실행) |
| `GET` | `/api/crawl/status` | 현재 동기화 단계/메시지 |
| `GET` | `/api/crawl/logs` | 최근 동기화 로그 (ring buffer, 최대 200줄) |
| `GET` | `/health` | 헬스체크 |

### 디렉토리

```
backend/
├── app/
│   ├── main.py               # FastAPI 진입점 + CORS + 라우터 등록
│   ├── config.py             # 환경변수 / 경로
│   ├── routers/
│   │   ├── chat.py           # SSE 스트리밍
│   │   ├── history.py        # 세션 CRUD
│   │   ├── meta.py
│   │   ├── crawl.py          # 동기화 트리거 (토큰 인증)
│   │   └── stats.py          # 대시보드 통계 + 로그
│   ├── services/
│   │   ├── rag.py            # 04_hybrid_rag 동적 import + AnnouncementSource 매핑
│   │   ├── graph_layout.py   # graph_relations → KnowledgeGraph (ring 배치)
│   │   ├── crawler.py        # 풀 파이프라인 오케스트레이션 + 로그 ring buffer
│   │   └── session.py        # 세션/메시지 CRUD (sources/graph/retrieval JSON 영속)
│   └── db/
│       ├── models.py         # Session / Message (SQLModel)
│       └── database.py       # engine + 가벼운 마이그레이션 (graph_json, followups_json, retrieval_json 컬럼 자동 추가)
└── requirements.txt          # 루트 requirements 포함 + sqlmodel
```

### 실행

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

`http://localhost:8000/docs` 에서 Swagger UI 사용 가능.

---

## 전처리 파이프라인

파이프라인은 번호 순서대로 실행합니다. 백엔드의 `POST /api/crawl` 이 이 전체 흐름을 한 번에 자동화합니다.

### Step 0 — 크롤러 (`pipeline/00_crawler.py`)

- `cse.knu.ac.kr` 공지사항 게시판을 BeautifulSoup으로 크롤링
- 공지 본문 + 첨부파일(PDF, HWP, XLSX 등)을 `data/raw/`, `data/attachments/` 에 저장

### Step 1 — 파서 (`pipeline/01_parser.py`)

| 파일 형식 | 파싱 방법 |
|-----------|-----------|
| PDF | opendataloader-pdf v1.0+ `run()` API (JVM 기반 Markdown) + **pdfplumber 표 보강 + LLM 컬럼 레이블링** |
| HWP | LibreOffice 헤드리스 → 실패 시 pyhwp `hwp5txt` fallback |
| XLSX | pandas 멀티시트 텍스트 추출 |
| DOCX | python-docx 단락·표 추출 (병합 셀 중복 제거) |
| ZIP | 재귀 압축 해제 (zip-slip 방지) |

파싱 결과는 `data/parsed/` 에 JSON으로 저장되며, 이미 처리된 파일은 건너뜁니다(증분 처리).

### Step 2 — Vector DB 구축 (`pipeline/02_vector_db.py`)

| 스크립트 | 임베딩 모델 | Chroma 컬렉션 |
|----------|------------|--------------|
| `02_vector_db.py` (기본) | Upstage `embedding-passage` | `knu_cse_upstage_pro` |
| `02b_vector_db_bge.py` | `dragonkue/bge-m3-ko` (로컬) | `knu_cse_bge_ko` |
| `02c_vector_db_contextual.py` | Upstage + Anthropic Contextual Retrieval | `knu_cse_contextual` |

**chunk_id 형식** (03_graph_db 와 공유):
```
manual::{file_name}::chunk{i}
notice::{wr_id}::{att_name}::chunk{i}
notice_content::{wr_id}::chunk{i}
```

청킹: `RecursiveCharacterTextSplitter` (크기 800, 오버랩 150).

### Step 3 — Graph DB 구축 (`pipeline/03_graph_db.py`)

**Document → Chunk → Entity** 3계층 구조. 청크별 LLM 1회 호출(`solar-pro3`, `response_format=json_object`)로 도메인 특화 엔티티/관계 추출.

```bash
python pipeline/03_graph_db.py            # 증분
python pipeline/03_graph_db.py --rebuild  # 전체 재구축
```

도메인 노드 8종(`Department, Major, Program, Course, Requirement, Period, Organization, Person`), 관계 12종(`REQUIRES, HAS_CONDITION, HAS_EXCEPTION, BELONGS_TO, OFFERS, APPLIES_TO, HAS_DEADLINE, EXCLUDES, SUBSTITUTES_FOR, PART_OF, PROVIDES, RELATED_TO`). 관계에는 `evidence_chunk_id`, `source_doc_key` 가 저장되어 근거 추적이 가능합니다.

---

## Hybrid RAG 엔진

`pipeline/04_hybrid_rag.py`

```
쿼리
  │
  ├─ Dense 검색 (Chroma, top-15)
  │   └─ BM25Okapi + RRF 융합 (USE_BM25_HYBRID=1, 기본 ON)
  │   └─ solar-pro3 LLM 리랭크 → top-5 (USE_RERANK=1)
  │       도메인 특화 프롬프트: 트랙 태그 인식, 수치 정확도 우선
  │
  └─ Chunk-Anchored Graph Search (GRAPH_USAGE=anchored, 기본)
       벡터 결과의 chunk_id → Neo4j Chunk 조회
       Chunk -[:MENTIONS]-> Entity → 1-hop 의미 관계 확장
       연관 Entity 를 MENTIONS 하는 추가 Chunk 수집 (동일 문서 우선)
       ChromaDB 추가 청크 조회 → vector_docs 병합
       ▶ 병합 후 전체 재 Rerank (그래프 확장 청크 노이즈 제거)
       ▶ Graph Gating: 본문에 없는 triple 제거 (USE_GRAPH_GATING=1)
```

| GRAPH_USAGE | 동작 |
|---|---|
| `anchored` (기본) | Chunk-Anchored Graph Search — 최고 성능 |
| `context` | 그래프 결과를 LLM 컨텍스트에 직접 주입 |
| `expansion` | 그래프 결과로 쿼리 확장 후 재검색 |
| `off` | 그래프 비활성화 (Vector Only baseline) |

---

## 평가 시스템

### 벤치마크 데이터셋 (`evaluation/qa_dataset.json`)

104+개 질문-정답 쌍, 3가지 유형 (단일문서조회 / 조건해석 / 다문서결합), 5종 학생 페르소나.

### 평가 스크립트

| 스크립트 | 용도 |
|---|---|
| `evaluation/evaluate.py` | 단일 모델 평가, LLM-as-Judge (`solar-pro3`), Ctrl+C 중단 시 진행분 저장, 부분 평가 범위 대화형 입력 |
| `evaluation/evaluate_all_models.py` | 6가지 임베딩×LLM 조합 일괄 평가, 지수 백오프 + 체크포인트 재개 |
| `evaluation/ragas_eval.py` | RAGAS 4지표 평가 (faithfulness / answer_relevancy / context_precision / context_recall) |

결과는 색상 코딩된 Excel(`.xlsx`)과 JSON으로 `evaluation/results/` 에 저장됩니다.

---

## 설치 및 실행

### 사전 요구사항

- **Python 3.10+**
- **Node.js 20+** (프론트엔드)
- **Java 11+** (opendataloader-pdf)
- **LibreOffice** (HWP 파싱, PATH 등록 필요)
- **Docker** (Neo4j)

### 1. 의존성 설치

```bash
# Python
pip install -r requirements.txt
pip install -r backend/requirements.txt   # sqlmodel 추가

# (옵션) BGE 로컬 임베딩
pip install sentence-transformers

# 프론트엔드
cd front && npm install && cd ..
```

### 2. 환경 변수 설정

루트에 `.env` 작성 (`.env.example` 참고):

```env
# LLM / 임베딩
UPSTAGE_API_KEY=...
OPENAI_API_KEY=...
GOOGLE_API_KEY=...

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=강한_비밀번호

# 백엔드 / 동기화 인증
SYNC_ADMIN_TOKEN=관리자_동기화_토큰
CORS_ORIGINS=http://localhost:5173

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_db
```

### 3. Neo4j 실행

```bash
docker compose up -d
```

Neo4j 브라우저: http://localhost:7474

### 4. 인덱스 최초 구축

```bash
python pipeline/00_crawler.py
python pipeline/01_parser.py
python pipeline/02_vector_db.py
python pipeline/03_graph_db.py --rebuild
```

또는 백엔드가 떠있으면 `POST /api/crawl` 한 번으로 위 전 과정 자동 실행.

### 5. 백엔드 + 프론트엔드 기동

```bash
# 터미널 1
cd backend && python -m uvicorn app.main:app --reload --port 8000

# 터미널 2
cd front && npm run dev
```

http://localhost:5173 접속.

### 6. CLI 질의응답 / 평가 (서버 없이)

```bash
python pipeline/04_hybrid_rag.py        # 대화형 CLI
python evaluation/evaluate.py           # 평가 (범위 선택)
python evaluation/ragas_eval.py         # RAGAS 평가
```

---

## 배포 (홈서버 / Docker)

`docker-compose.prod.yml` + `Dockerfile.backend` + `front/Dockerfile` + `deploy/nginx.conf` 로 풀 스택 배포.

```
┌─────────────────────────────────────────────┐
│  rag-frontend   nginx (정적 SPA + /api 프록시)│
│  rag-backend    FastAPI + RAG pipeline       │
│  rag-neo4j      Neo4j 5.20 + APOC            │
└─────────────────────────────────────────────┘
        bind mount: data/, chroma_db/
```

### 실행

```bash
cp .env.example .env   # 실제 값 채우기 (UPSTAGE_API_KEY, NEO4J_PASSWORD 등)
docker compose -f docker-compose.prod.yml up -d --build
```

자세한 단계별 가이드는 [`docs/home-server-deploy.md`](docs/home-server-deploy.md).

---

## 환경 변수 레퍼런스

### Hybrid RAG 엔진 (`pipeline/04_hybrid_rag.py`)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `EMBED_BACKEND` | `upstage` | 임베딩 백엔드: `upstage` / `bge` / `contextual` |
| `GRAPH_USAGE` | `anchored` | 그래프 활용 방식: `anchored` / `context` / `expansion` / `off` |
| `USE_RERANK` | `1` | LLM 리랭크 사용 여부 |
| `USE_BM25_HYBRID` | `1` | BM25 + RRF 하이브리드 검색 |
| `USE_GRAPH_GATING` | `1` | 본문에 없는 triple 제거 |
| `USE_VERIFICATION` | `0` | Chain-of-Verification (CoV) |
| `HYBRID_V3` | `0` | 실험적 LightRAG/PathRAG/CRAG 그래프 검색 |
| `RETRIEVE_K` | `15` | 벡터 검색 상위 K |
| `BM25_K` | `15` | BM25 검색 상위 K |
| `RERANK_TO_K` | `5` | 리랭크 후 유지 상위 K |

### 백엔드 (`backend/app/config.py`)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | 허용 origin 콤마구분 |
| `SYNC_ADMIN_TOKEN` | — | `POST /api/crawl` 의 `X-Sync-Token` 헤더 일치 검증 |
| `MAX_SYNC_PAGES` | `5` | 1회 크롤 최대 페이지 수 |

### 프론트엔드 (Vite)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_API_BASE_URL` | `''` (proxy 사용) | 백엔드 절대 URL (홈서버 배포 시) |
| `VITE_USE_MOCK` | `false` | 백엔드 없이 mock 응답으로 UI 개발 |
| `VITE_CHAT_STREAM_TIMEOUT_MS` | `30000` | SSE 타임아웃 |

---

## 디렉토리 구조

```
CapstoneDesign_6/
├── backend/                         # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/ (chat, history, meta, crawl, stats)
│   │   ├── services/ (rag, graph_layout, crawler, session)
│   │   └── db/ (models, database)
│   └── requirements.txt
│
├── front/                           # Vite/React 프론트엔드
│   ├── src/ (pages, components, hooks, api, store, types)
│   ├── Dockerfile
│   └── package.json
│
├── pipeline/
│   ├── 00_crawler.py
│   ├── 01_parser.py
│   ├── 02_vector_db.py              # (02b/02c — 대안 임베딩 백엔드)
│   ├── 03_graph_db.py
│   └── 04_hybrid_rag.py             # 메인 RAG 엔진
│
├── evaluation/
│   ├── evaluate.py
│   ├── evaluate_all_models.py
│   ├── ragas_eval.py                # RAGAS 4지표
│   └── qa_dataset.json
│
├── data/
│   ├── raw/                         # notices.json (크롤 결과)
│   ├── parsed/                      # 파싱 결과 JSON
│   ├── attachments/                 # 첨부파일 원본
│   ├── manual_files/                # 수동 추가 문서
│   ├── app.db                       # SQLite 세션/메시지 (gitignore)
│   └── graph_state.json             # 그래프 증분 처리 상태
│
├── docs/
│   ├── PRD.md                       # 제품 요구사항
│   ├── home-server-deploy.md        # 홈서버 배포 가이드
│   ├── ablation-2hop.md             # Ablation 실험 기록
│   ├── graph_db_redesign.md
│   └── rag_improvement_backlog.md
│
├── deploy/nginx.conf                # 프론트 컨테이너 nginx 설정
├── docker-compose.yml               # Neo4j (개발용)
├── docker-compose.prod.yml          # 풀 스택 배포 (neo4j + backend + frontend)
├── Dockerfile.backend
├── requirements.txt
├── make_dataset.py                  # 벤치마크 생성 스크립트
└── .env                             # API 키 등 (git 제외)
```

---

## 주요 설계 결정 및 Ablation 결과

| 실험 | 결과 | 결정 |
|------|------|------|
| 청크 크기 250 vs 500 | 250이 -9점 열세 | 500 → 현재 **800** (표 구조 혼재 완화 + chunk_id 브리지 정합) |
| 2-hop 그래프 탐색 | -3점, 5.6배 느림 | 1-hop 유지 |
| BGE-m3-ko 임베딩 | -6점 (이 도메인에서) | Upstage 유지 |
| Contextual Retrieval | 67% 실패율 | 미채택 |
| 그래프 노이즈 게이팅 | cross-doc 확장 후 노이즈 제거에 유효 | **ON** |
| GRAPH_USAGE=anchored vs context/expansion | anchored 최고 성능 | anchored 기본값 |
| 요약 후 추출 vs 직접 추출 | 요약 단계에서 조건·예외 관계 손실 | 요약 제거, 원문 직접 추출 |
| 문서 단위 추출 vs 청크 단위 추출 | 문서 단위는 6000자 트런케이션으로 정보 손실 | 1500자 청크 단위 추출 |
| 엔티티 properties 포함 vs 제거 | 출력 토큰 ~40% 감소, 잘림 오류 해소 | 제거 (수치는 청크 본문에 보존) |

자세한 내용은 [`docs/ablation-2hop.md`](docs/ablation-2hop.md), [`docs/rag_improvement_backlog.md`](docs/rag_improvement_backlog.md).

---

## 기술 스택 요약

| 분류 | 기술 |
|------|------|
| 프론트엔드 | Vite 5 · React 18 · TypeScript 5.6 · Tailwind 3 · Zustand · Axios |
| 백엔드 | FastAPI · SQLModel · SQLite · uvicorn · Pydantic |
| 언어 | Python 3.10+ |
| 벡터 DB | ChromaDB 0.6 |
| 그래프 DB | Neo4j 5.20 (Docker, APOC) |
| LLM (생성·리랭크·판사) | Upstage `solar-pro3` |
| 임베딩 | Upstage `embedding-passage` (기본), BGE-m3-ko (대안) |
| LLM 프레임워크 | LangChain 0.3 · openai SDK |
| 문서 파싱 | opendataloader-pdf · pdfplumber · pyhwp · LibreOffice · python-docx |
| 검색 보강 | BM25Okapi (rank-bm25) · RRF |
| 평가 | LLM-as-Judge · RAGAS · openpyxl |
| 인프라 | Docker Compose · nginx (정적 SPA 서빙 + /api 프록시) |

---

## 변경 이력

가장 최근 변경부터 역순으로 정리합니다. 이전 파이프라인 단위 상세 변경은 `pipeline/` 각 파일 상단 docstring 참고.

### 최근 (애플리케이션 레이어 추가)

| 항목 | 내용 |
|------|------|
| **`backend/` FastAPI 서버 신설** | SSE 챗 엔드포인트 + 세션/메시지 영속화(SQLite) + 동기화 API |
| **`front/` 웹 챗봇 신설** | Vite + React + Tailwind, mock 모드 지원 |
| **③ 데이터 수집 모니터링 대시보드** | `GET /api/stats` + `GET /api/crawl/logs` + `DashboardPage` (KPI / 30일 sparkline / 카테고리 / 실시간 로그 / 최신 공지) |
| **④ 검색 결과·컨텍스트 확인 패널** | SSE `retrieval` 청크 추가, `RetrievalDebugPanel` 3탭 (Vector / Graph / LLM 컨텍스트), `Message.retrieval_json` 영속화 |
| **풀 동기화 파이프라인** | `POST /api/crawl` 한 번 호출로 crawl → parse → vector(증분) → graph(증분) → cache reload 자동 실행, `X-Sync-Token` 인증 |
| **그래프 시각화 동적화** | 백엔드가 `hybrid_rag.graph_relations` → ring 레이아웃 → `KnowledgeGraph` 청크로 전송 (이전엔 하드코딩된 더미) |
| **홈서버 배포 산출물** | `docker-compose.prod.yml`, `Dockerfile.backend`, `front/Dockerfile`, `deploy/nginx.conf`, `.env.example`, `docs/home-server-deploy.md` |
| **Neo4j 5.x strict 환경 호환** | `NEO4J_USER`/`NEO4J_PASSWORD` env 제거 (NEO4J_AUTH 만 유지) — 5.x 가 모든 `NEO4J_` 접두 env 를 config key 로 파싱하는 strict_validation 충돌 해결 |

### RAG 코어 (요약)

| 항목 | 내용 |
|------|------|
| `pipeline/01_parser.py` | PDF 표 트랙 어노테이션, pdfplumber + LLM 컬럼 레이블링, opendataloader v1.0+ API, DOCX 병합 셀 중복 제거, 공지 단위 중간 저장 |
| `pipeline/02_vector_db.py` | chunk_id 형식 통일 (`{source_type}::...::chunk{i}`), 800/150 청크, 공지 본문 인덱싱, 짧은 청크 필터(20자), 메타데이터(date, notice_num) |
| `pipeline/03_graph_db.py` | Document → Chunk → Entity 3계층 재설계, chunk_id 브리지(800/150 통일), 요약 단계 제거 + 청크 단위 추출, 도메인 8노드/12관계 스키마, `response_format=json_object`, 엔티티/관계 상한, ALIAS_MAP 30개 규칙 정규화, CO_OCCURS 자동 생성, `ensure_constraints()`, `_recover_partial_json()` |
| `pipeline/04_hybrid_rag.py` | chunk_id 브리지 기반 anchored 모드, BM25+RRF 기본 ON, 그래프 확장 동일 문서 우선 + 통합 Rerank, Graph Gating(`STRICT_GATING_RELS` 확장), 트랙 태그 인식 프롬프트, `GENERATION_TEMPERATURE=0` |
| `evaluation/evaluate.py` | LLM-as-Judge 프롬프트 개선, Ctrl+C 중단 시 진행분 저장, `_prompt_eval_range()` 대화형 범위 선택, xlsx Excel 수식 prefix 무력화 |
| `evaluation/ragas_eval.py` | RAGAS 4지표 평가 별도 스크립트 분리 |
