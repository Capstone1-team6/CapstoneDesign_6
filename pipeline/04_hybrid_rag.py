import os
import re
from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings
from neo4j import GraphDatabase
from openai import OpenAI
from langchain_upstage import UpstageEmbeddings

# ── 경로 / 환경변수 ─────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")

load_dotenv(ENV_PATH)

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password1234")
UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")

# 실제 생성된 컬렉션 이름에 맞춤
EXPERIMENT_ID = "upstage_pro"  # 6개 실험 중 하나로 설정
COLLECTION_NAME = f"knu_cse_{EXPERIMENT_ID}"

upstage_client = OpenAI(api_key=UPSTAGE_API_KEY, base_url="https://api.upstage.ai/v1")


def get_embedding_function():
    return UpstageEmbeddings(
        model="solar-embedding-1-large-passage",
        api_key=UPSTAGE_API_KEY,
    )


def get_chroma_client():
    return chromadb.PersistentClient(
        path=CHROMA_DIR,
        settings=Settings(anonymized_telemetry=False)
    )


def get_neo4j_driver():
    return GraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USER, NEO4J_PASSWORD)
    )


# ── Vector 검색 ──────────────────────────────────────────
<<<<<<< Updated upstream
def vector_search(query, n_results=3):
    """Chroma에서 유사도 기반 검색"""
    embedding_fn = get_embedding_function()
=======
RERANK_MODEL = "solar-pro2"  # cross-encoder 대안 — torch 없이 LLM rerank.
USE_RERANK = os.getenv("USE_RERANK", "1") == "1"
USE_BM25_HYBRID = os.getenv("USE_BM25_HYBRID", "1") == "1"  # Anthropic: +RRF → 실패율 -49%
RETRIEVE_K = int(os.getenv("RETRIEVE_K", "15"))  # rerank 전 1차 dense 검색량 (↑ 후보 풀)
BM25_K = int(os.getenv("BM25_K", "15"))           # BM25 1차 검색량
RERANK_TO_K = int(os.getenv("RERANK_TO_K", "5"))  # rerank 후 최종

# Phase 13 가설: rerank 가 vector 정확도 깎지만 (V↓6), graph anchor 의 시작점
# 으로는 도움 (더 topically relevant chunks). 분리해서 vector 답변엔 raw,
# graph anchor 엔 reranked 사용.
# USE_RERANK=0 + RERANK_FOR_GRAPH_ANCHOR=1 → vector raw + graph anchor reranked.
RERANK_FOR_GRAPH_ANCHOR = os.getenv("RERANK_FOR_GRAPH_ANCHOR", "0") == "1"

# BM25 캐시 (lazy build) — Chroma 전체 dump 후 코퍼스 토큰화. 첫 query 만 비용.
_BM25_CACHE = {"index": None, "docs": None}


def _build_bm25_index():
    """Chroma 전체 chunk 를 한 번만 dump 해서 BM25 코퍼스 구축.
    한국어 토큰화는 단순 whitespace split — 행정 문서는 띄어쓰기 단위로 핵심
    단어 (학번/금액/제도명) 가 분리돼 있어 충분. 형태소 분석기 (Mecab 등)
    추가 효과 작고 의존성 큼."""
    from rank_bm25 import BM25Okapi
>>>>>>> Stashed changes
    client = get_chroma_client()

    existing_collections = [
    c.name if hasattr(c, 'name') else c
    for c in client.list_collections()
    ]
    if COLLECTION_NAME not in existing_collections:
        raise ValueError(
            f"컬렉션이 없습니다: {COLLECTION_NAME} | 현재 컬렉션: {existing_collections}"
        )

    collection = client.get_collection(COLLECTION_NAME)

    query_embedding = embedding_fn.embed_query(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    docs = []
    ids       = results.get("ids",       [[]])[0]
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]
<<<<<<< Updated upstream

    for doc, meta, dist in zip(documents, metadatas, distances):
        score = round(1 - dist, 3) if dist is not None else None
        docs.append({
            "content": doc,
            "source": meta.get("file_name", "") if meta else "",
            "score": score
=======
    for chunk_id, doc, meta, dist in zip(ids, documents, metadatas, distances):
        score = round(1 - dist, 3) if dist is not None else None
        docs.append({
            "content":  doc,
            "source":   (meta or {}).get("file_name", ""),
            "score":    score,
            "chunk_id": chunk_id,                          # Graph 브리지용
            "doc_key":  (meta or {}).get("doc_key", ""),   # Graph 브리지용
>>>>>>> Stashed changes
        })

    return docs


# ── 질문 키워드 추출 ─────────────────────────────────────
def extract_keywords(query):
    """질문에서 그래프 검색용 핵심 키워드 추출"""
    stopwords = {
        "어떻게", "무엇", "뭐", "인가요", "있나요", "해주세요", "알려줘",
        "알려주세요", "가능한가요", "되는가요", "관련", "대한", "에서",
        "으로", "를", "을", "이", "가", "은", "는", "와", "과", "좀",
        "무슨", "어떤", "정도", "대한", "하고", "하면", "하나요"
    }

    cleaned = re.sub(r"[^\w\s]", " ", query)
    tokens = []

    for token in cleaned.split():
        token = token.strip()
        if len(token) < 2:
            continue
        if token in stopwords:
            continue
        tokens.append(token)

<<<<<<< Updated upstream
    # 중복 제거하면서 순서 유지
    unique_tokens = []
    seen = set()
    for token in tokens:
        if token not in seen:
            unique_tokens.append(token)
            seen.add(token)

    return unique_tokens[:5]
=======
    candidates_text = "\n".join(
        f"[{i}] (출처: {d.get('source','')[:40]})\n{d.get('content','')[:800]}"
        for i, d in enumerate(docs)
    )
    prompt = f"""경북대학교 행정 문서에서 아래 질문에 답변하기 위해 가장 관련 있는 문서 순위를 매기세요.

질문: {query}

후보 문서:
{candidates_text}

순위 기준 (중요도 순):
1. 질문에서 묻는 특정 제도·트랙·요건의 수치·조건이 직접 명시된 문서 최우선
2. [다중전공트랙] [해외복수학위트랙] [학석사연계트랙] 같은 트랙 태그가 붙은 항목이 있으면 해당 트랙 관련 문서 우선
3. 질문과 동일한 핵심 키워드(학점 수, 점수, 기간, 자격 조건)를 정확히 포함한 문서
4. 출처 파일명이 질문 주제와 직접 연관된 문서

응답 형식: 관련 높은 순서로 인덱스 번호만 쉼표 구분 (전체 포함)
예: 3, 0, 5, 7, 2

순위:"""
    try:
        r = upstage_client.chat.completions.create(
            model=RERANK_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=150,
        )
        text = (r.choices[0].message.content or "").strip()
        # parse "3, 0, 5, ..." → 인덱스 list
        import re as _re
        indices = []
        for tok in _re.split(r"[,，\s]+", text):
            tok = tok.strip().strip(".]:)[")
            if tok.isdigit():
                idx = int(tok)
                if 0 <= idx < len(docs) and idx not in indices:
                    indices.append(idx)
        # 누락 인덱스는 원래 순서로 끝에 붙임 (안전망)
        for i in range(len(docs)):
            if i not in indices:
                indices.append(i)
        reranked = [docs[i] for i in indices[:top_k]]
        return reranked
    except Exception:
        # rerank 실패 시 원래 dense 순서 top-K
        return docs[:top_k]


def vector_search(query, n_results=5):
    """Retrieval pipeline:
      1. Dense (Chroma) RETRIEVE_K = 10
      2. (옵션) BM25 BM25_K = 10 → RRF 결합 → 상위 RETRIEVE_K
      3. (옵션) LLM rerank → 최종 RERANK_TO_K = 5

    토글 (env var):
      USE_RERANK=1 (기본)        — LLM rerank 적용
      USE_BM25_HYBRID=0 (기본)  — BM25 추가 + RRF
      RETRIEVE_K, BM25_K, RERANK_TO_K — 각 단계 K 조절

    Anthropic Contextual Retrieval (2024-09):
      dense only          baseline
      dense + BM25 + RRF  retrieval 실패율 -49%
      + cross-encoder     retrieval 실패율 -67%
    """
    dense = _raw_vector_search(query, n_results=RETRIEVE_K)

    if USE_BM25_HYBRID:
        try:
            sparse = bm25_search(query, top_k=BM25_K)
            candidates = rrf_combine(dense, sparse, top_k=RETRIEVE_K)
        except Exception:
            candidates = dense
    else:
        candidates = dense

    if USE_RERANK:
        return llm_rerank(query, candidates, top_k=RERANK_TO_K)
    else:
        return candidates[:n_results]
>>>>>>> Stashed changes


# ── Graph 검색 ───────────────────────────────────────────
def graph_search(query, max_nodes_per_keyword=5, max_relations=20):
    """Neo4j에서 키워드 기반 관계 탐색"""
    driver = get_neo4j_driver()
<<<<<<< Updated upstream
    results = []
=======
    seen = {}

    try:
        with driver.session() as session:
            for seed_id, seed_name, sim in seeds:
                rows = session.run("""
                    MATCH (a)-[r]-(b)
                    WHERE elementId(a) = $id
                      AND NOT b:Document
                      AND type(r) IN $types
                    RETURN
                        coalesce(startNode(r).name, '') AS from_name,
                        type(r) AS rel,
                        coalesce(endNode(r).name, '') AS to_name,
                        coalesce(b.name, '') AS neighbor_name,
                        COUNT { (b)--() } AS neighbor_degree
                    LIMIT 15
                """, {"id": seed_id, "types": MEANINGFUL_RELATIONS}).data()

                for row in rows:
                    from_n = (row.get("from_name") or "").strip()
                    to_n = (row.get("to_name") or "").strip()
                    rel = (row.get("rel") or "").strip()
                    neighbor = (row.get("neighbor_name") or "").strip()
                    neighbor_deg = row.get("neighbor_degree") or 1

                    if not from_n or not to_n or not rel:
                        continue

                    score = sim
                    score *= RELATION_TYPE_WEIGHT.get(rel, 1.0)

                    if neighbor in seed_names:
                        score *= 1.5

                    if neighbor_deg > 20:
                        score *= 0.5
                    elif neighbor_deg > 10:
                        score *= 0.7

                    key = (from_n, rel, to_n)
                    if key not in seen or seen[key]["score"] < score:
                        seen[key] = {
                            "from": from_n, "relation": rel, "to": to_n,
                            "score": score,
                        }
    finally:
        driver.close()

    triples = sorted(seen.values(), key=lambda x: (-x["score"], x["from"]))
    return [
        {"from": t["from"], "relation": t["relation"], "to": t["to"]}
        for t in triples[:max_relations]
    ]


# ═══════════════════════════════════════════════════════════════════
# Vector-anchored graph search (Phase 10) — body-grounded only
# ═══════════════════════════════════════════════════════════════════
# 동기 (Phase 8/9b 결과): query/embedding seed 기반 graph_search 가 vector
# 본문과 disconnect 된 triple 을 가져와서 LLM 답변을 망쳤음 (V=73 → H=64).
# 해결: vector top-K 본문에 *명시적으로 등장* 하는 entity 만 graph 시작점으로
# 사용하고, 1-hop 결과 중 *양쪽 endpoint 가 모두 본문에 등장* 하는 triple
# 만 keep. 이러면 graph 가 "본문 안에서 발견된 entity 들의 명시적 관계"
# 만 표면화 — 노이즈 0 보장.

# 모든 graph 노드 이름 캐시 (1번만 빌드).
_GRAPH_NODE_NAMES = None


def _get_all_graph_node_names() -> list[str]:
    global _GRAPH_NODE_NAMES
    if _GRAPH_NODE_NAMES is None:
        driver = get_neo4j_driver()
        names = []
        try:
            with driver.session() as s:
                rows = s.run(
                    "MATCH (n) WHERE NOT n:Document AND coalesce(n.name,'') <> '' "
                    "RETURN n.name AS name"
                ).data()
                names = [(r["name"] or "").strip() for r in rows if r["name"]]
        finally:
            driver.close()
        # 길이 ≥ 2 만 (1글자 false-positive 회피)
        _GRAPH_NODE_NAMES = sorted({n for n in names if len(n) >= 2}, key=lambda x: -len(x))
    return _GRAPH_NODE_NAMES


def _entities_in_body(body_text: str) -> set[str]:
    """본문 텍스트에서 graph 노드 이름이 substring 으로 등장하는 것만 추출.
    긴 entity 우선 매칭 (한국어 행정 도메인의 합성어 매칭에 유리)."""
    if not body_text:
        return set()
    found = set()
    for name in _get_all_graph_node_names():
        if name in body_text:
            found.add(name)
    return found


def chunk_anchored_graph_search(
    vector_docs: list[dict],
    max_relations: int = 5,
    max_extra_chunks: int = 3,
) -> tuple[list[dict], list[str]]:
    """chunk_id 브리지 기반 그래프 검색 (Document/Chunk/Entity 3계층 구조용).

    흐름:
      1. vector_docs 의 chunk_id → Neo4j Chunk 노드 조회
      2. Chunk -[:MENTIONS]-> Entity (직접 연결 엔티티)
      3. Entity -[관계]-> Entity 1-hop 확장
      4. 확장된 Entity 를 MENTIONS 하는 다른 Chunk 의 chunk_id 수집
      5. 관계 목록 + 추가 chunk_id 반환

    반환: (relations, extra_chunk_ids)
      relations:       [{from, relation, to, evidence_chunk_id}, ...]
      extra_chunk_ids: 확장된 chunk_id 목록 (ChromaDB 추가 조회용)
    """
    chunk_ids = [d["chunk_id"] for d in vector_docs if d.get("chunk_id")]
    if not chunk_ids:
        return [], []

    driver = get_neo4j_driver()
    relations: list[dict] = []
    extra_chunk_ids: list[str] = []

    try:
        with driver.session() as s:
            # Step 1~2: 해당 청크들이 언급하는 Entity 조회
            seed_rows = s.run("""
                MATCH (c:Chunk)-[:MENTIONS]->(e:Entity)
                WHERE c.chunk_id IN $chunk_ids
                RETURN DISTINCT e.name AS name
            """, {"chunk_ids": chunk_ids}).data()
            seed_names = [r["name"] for r in seed_rows if r.get("name")]

            if not seed_names:
                return [], []

            # Step 3: seed Entity 간 1-hop 관계 (의미 있는 타입만)
            rel_rows = s.run("""
                MATCH (a:Entity)-[r]->(b:Entity)
                WHERE a.name IN $names
                  AND type(r) IN $types
                RETURN a.name AS f, type(r) AS rel, b.name AS t,
                       r.evidence_chunk_id AS ev_chunk
                LIMIT $limit
            """, {
                "names": seed_names,
                "types": MEANINGFUL_RELATIONS,
                "limit": max_relations * 3,
            }).data()

            seen: dict[tuple, dict] = {}
            expanded_names = set(seed_names)
            for row in rel_rows:
                f, rel, t = row["f"], row["rel"], row["t"]
                if not f or not t or f == t:
                    continue
                score = RELATION_TYPE_WEIGHT.get(rel, 1.0)
                key = (f, rel, t)
                if key not in seen or seen[key]["score"] < score:
                    seen[key] = {
                        "from": f, "relation": rel, "to": t,
                        "score": score,
                        "evidence_chunk_id": row.get("ev_chunk", ""),
                    }
                expanded_names.add(t)

            relations = [
                {"from": v["from"], "relation": v["relation"],
                 "to": v["to"], "evidence_chunk_id": v.get("evidence_chunk_id", "")}
                for v in sorted(seen.values(), key=lambda x: -x["score"])[:max_relations]
            ]

            # Step 4: 확장된 Entity 를 언급하는 다른 Chunk 의 chunk_id 수집
            # 앵커 문서(벡터 검색 결과)와 동일한 doc_key 청크를 우선 반환 → cross-doc 노이즈 방지
            new_names = list(expanded_names - set(seed_names))
            if new_names:
                anchor_doc_keys = list({
                    d.get("doc_key", "") for d in vector_docs if d.get("doc_key")
                })
                extra_rows = s.run("""
                    MATCH (c:Chunk)-[:MENTIONS]->(e:Entity)
                    WHERE e.name IN $names
                      AND NOT c.chunk_id IN $existing_ids
                    WITH c,
                         CASE WHEN c.doc_key IN $anchor_doc_keys THEN 0 ELSE 1 END AS same_doc
                    RETURN DISTINCT c.chunk_id AS chunk_id, same_doc
                    ORDER BY same_doc ASC
                    LIMIT $limit
                """, {
                    "names": new_names,
                    "existing_ids": chunk_ids,
                    "anchor_doc_keys": anchor_doc_keys,
                    "limit": max_extra_chunks,
                }).data()
                extra_chunk_ids = [r["chunk_id"] for r in extra_rows if r.get("chunk_id")]

    finally:
        driver.close()

    return relations, extra_chunk_ids


def fetch_chunks_by_ids(chunk_ids: list[str]) -> list[dict]:
    """chunk_id 목록으로 ChromaDB 에서 청크 텍스트를 직접 조회."""
    if not chunk_ids:
        return []
    try:
        client = get_chroma_client()
        collection = client.get_collection(COLLECTION_NAME)
        results = collection.get(ids=chunk_ids, include=["documents", "metadatas"])
        docs = []
        for cid, doc, meta in zip(
            results.get("ids", []),
            results.get("documents", []),
            results.get("metadatas", []),
        ):
            if doc:
                docs.append({
                    "content":  doc,
                    "source":   (meta or {}).get("file_name", ""),
                    "score":    None,
                    "chunk_id": cid,
                    "doc_key":  (meta or {}).get("doc_key", ""),
                })
        return docs
    except Exception as e:
        print(f"[fetch_chunks_by_ids 오류] {e}")
        return []


def vector_anchored_graph_search(
    query, vector_docs, max_relations: int = 5,
) -> list[dict]:
    """진짜 vector-anchored — vector 본문에 등장한 entity 만 graph 시작점으로,
    1-hop 결과 중 양쪽 endpoint 모두 본문에 등장한 triple 만 surface.

    Phase 8/9b 의 노이즈 ("query embedding 으로 graph node 잡는 방식이 본문과
    disconnect") 를 완전 제거. graph 가 본문에 없는 정보를 끌어올 수 없음.
    """
    if not vector_docs:
        return []
    body = "\n".join((d.get("content") or "") for d in vector_docs)
    body_entities = _entities_in_body(body)
    if len(body_entities) < 2:
        # entity 1개 이하면 의미있는 관계 형성 불가
        return []

    driver = get_neo4j_driver()
    seen = {}
    try:
        with driver.session() as s:
            rows = s.run("""
                MATCH (a)-[r]->(b)
                WHERE NOT a:Document AND NOT b:Document
                  AND coalesce(a.name,'') IN $names
                  AND coalesce(b.name,'') IN $names
                  AND type(r) IN $types
                RETURN a.name AS f, type(r) AS rel, b.name AS t
            """, {
                "names": list(body_entities),
                "types": MEANINGFUL_RELATIONS,
            }).data()
        for row in rows:
            f, rel, t = row["f"].strip(), row["rel"].strip(), row["t"].strip()
            if not f or not t or not rel or f == t:
                continue
            score = RELATION_TYPE_WEIGHT.get(rel, 1.0)
            key = (f, rel, t)
            if key not in seen or seen[key]["score"] < score:
                seen[key] = {"from": f, "relation": rel, "to": t, "score": score}
    finally:
        driver.close()

    out = sorted(seen.values(), key=lambda x: -x["score"])
    return [{"from": t["from"], "relation": t["relation"], "to": t["to"]}
            for t in out[:max_relations]]


# ═══════════════════════════════════════════════════════════════════
# Plan B v2: LightRAG dual-seed + doc-restricted 2-hop + PathRAG flow
# ═══════════════════════════════════════════════════════════════════
# 출처:
# - LightRAG (arxiv 2410.05779): low-level (entity) + high-level (theme/relation)
#   키워드를 LLM 으로 추출해 두 개의 vector index 에 매칭.
# - PathRAG (arxiv 2502.14902): flow-based pruning (resource propagation) +
#   reliability 오름차순 prompt ordering (recency bias). Ablation 결과 path
#   prompting 이 flat triple dump 대비 +56% win rate.
# - CRAG (arxiv 2401.15884): retrieval evaluator → 신뢰도 낮으면 graph skip.

def extract_high_level_keywords(query: str, max_keywords: int = 5) -> list[str]:
    """LightRAG dual-level 의 high-level keyword 추출.
    질문의 *관계 의도* (조건/예외/대체/마감 등) 를 뽑아 relation index 와 매칭.

    예: "복학생도 계절학기 신청 가능?" → ["조건", "대상", "예외"]
        "글솝 졸업요건 중 기술창업역량은?" → ["요건", "조건", "포함"]
    """
    prompt = f"""아래 질문이 묻는 *관계 의도* 를 한국어 명사 키워드로 뽑으세요.

규칙:
- entity (군휴학, 글솝 등 고유명사) 가 아니라 *어떤 관계를 묻는지* 의 키워드만
- 예시 카테고리: 조건, 자격, 대상, 요건, 마감, 예외, 대체, 동등경로, 제외, 포함, 적용, 비용, 보상, 임계값
- 쉼표로만 구분, 추가 설명 금지, 최대 {max_keywords}개

질문: {query}
관계 키워드:"""
    try:
        r = upstage_client.chat.completions.create(
            model=HIGH_LEVEL_KW_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=60,
        )
        text = (r.choices[0].message.content or "").strip()
        kws = [k.strip().strip("·-•*").strip() for k in re.split(r"[,，、\n]+", text)]
        kws = [k for k in kws if 2 <= len(k) <= 20]
        return kws[:max_keywords]
    except Exception:
        return []


def _entity_seed_search(query: str, top_n: int = 8) -> list[dict]:
    """현재 graph_search 와 같은 방식 — query 임베딩으로 entity 노드 top-N.
    반환: [{"node_id", "name", "sim"}, ...] (sim = 1/(1+dist))"""
    chroma = get_chroma_client()
    if GRAPH_NODES_COLLECTION not in list(chroma.list_collections()):
        return []
    coll = chroma.get_collection(GRAPH_NODES_COLLECTION)
    # graph_nodes 는 Upstage 임베딩으로 빌드 → 같은 공간 매칭 필요
    embedding_fn = get_graph_query_embedding_function()
    q_emb = embedding_fn.embed_query(query)
    res = coll.query(query_embeddings=[q_emb], n_results=top_n)
    out = []
    for sid, meta, dist in zip(
        res.get("ids", [[]])[0],
        res.get("metadatas", [[]])[0],
        res.get("distances", [[]])[0],
    ):
        sim = 1.0 / (1.0 + max(0.0, dist or 0))
        out.append({"node_id": sid, "name": (meta or {}).get("name", ""), "sim": sim})
    return out


def _relation_seed_search(high_kws: list[str], top_m: int = 6) -> list[dict]:
    """LightRAG high-level 매칭 — keyword 임베딩으로 relation index top-M.
    매칭된 relation 의 양쪽 노드명 반환 (graph 시작점 후보).
    반환: [{"name", "sim"}, ...]"""
    if not high_kws:
        return []
    chroma = get_chroma_client()
    if GRAPH_RELATIONS_COLLECTION not in list(chroma.list_collections()):
        return []
    coll = chroma.get_collection(GRAPH_RELATIONS_COLLECTION)
    # graph_relations 도 Upstage 임베딩으로 빌드 → 같은 공간 매칭 필요
    embedding_fn = get_graph_query_embedding_function()
    # 각 키워드별 검색 후 합치는 방식 — 단일 임베딩으로 쳐도 되지만 키워드별
    # 검색이 facet 분리에 더 유리.
    seed_nodes = {}  # name -> max sim
    per_kw_top = max(2, top_m // max(len(high_kws), 1) + 1)
    for kw in high_kws:
        try:
            kw_emb = embedding_fn.embed_query(kw)
            res = coll.query(query_embeddings=[kw_emb], n_results=per_kw_top)
            metas = res.get("metadatas", [[]])[0]
            dists = res.get("distances", [[]])[0]
            for meta, dist in zip(metas, dists):
                sim = 1.0 / (1.0 + max(0.0, dist or 0))
                for name in (meta.get("from_name", ""), meta.get("to_name", "")):
                    name = name.strip()
                    if not name:
                        continue
                    if name not in seed_nodes or seed_nodes[name] < sim:
                        seed_nodes[name] = sim
        except Exception:
            continue
    out = sorted(
        [{"name": n, "sim": s} for n, s in seed_nodes.items()],
        key=lambda x: -x["sim"],
    )
    return out[:top_m]


def _fuzzy_file_match(graph_files: list, vector_files: set) -> bool:
    """vector file_name 과 graph source_files 형식 차이 (notice 는 [공지] |
    suffix) 우회용 fuzzy 매칭."""
    for gf in graph_files or []:
        for vf in vector_files:
            if gf == vf or vf in gf or gf in vf:
                return True
    return False


def _fetch_paths_from_seeds(
    seed_node_ids: list[str], seed_node_names: list[str],
    files: set, max_hops: int = 2, limit: int = 200,
) -> list[dict]:
    """Doc 제한 안에서 seed 들로부터 1~max_hops path 추출.
    seed_node_ids (elementId, entity 임베딩 결과) + seed_node_names
    (relation index 매칭 결과) 둘 다 시작점으로.
    files 비면 doc 제한 미적용."""
    if not seed_node_ids and not seed_node_names:
        return []

    driver = get_neo4j_driver()
    paths_out = []
    try:
        with driver.session() as session:
            cypher = f"""
                MATCH (start)
                WHERE NOT start:Document
                  AND coalesce(start.name, '') <> ''
                  AND (
                       elementId(start) IN $seed_ids
                       OR start.name IN $seed_names
                  )
                WITH DISTINCT start
                MATCH path = (start)-[r*1..{max_hops}]-(neighbor)
                WHERE ALL(rel IN r WHERE type(rel) IN $types)
                  AND NOT neighbor:Document
                  AND coalesce(neighbor.name, '') <> ''
                RETURN
                    [n IN nodes(path) | coalesce(n.name, '')] AS path_nodes,
                    [rel IN relationships(path) | type(rel)] AS path_rels,
                    length(path) AS hop_len,
                    [n IN nodes(path) | coalesce(n.source_files, [])] AS node_files
                ORDER BY hop_len ASC
                LIMIT $limit
            """
            rows = session.run(cypher, {
                "seed_ids": seed_node_ids,
                "seed_names": seed_node_names,
                "types": MEANINGFUL_RELATIONS,
                "limit": limit,
            }).data()
        for row in rows:
            nodes = [n for n in (row.get("path_nodes") or []) if n]
            rels = row.get("path_rels") or []
            if len(nodes) < 2 or not rels:
                continue
            node_files = row.get("node_files") or []
            # Doc 제한: vector files 있을 때만 in-doc 체크
            if files:
                in_doc = all(_fuzzy_file_match(nfs, files) for nfs in node_files)
            else:
                in_doc = True
            paths_out.append({
                "nodes": nodes,
                "relations": rels,
                "hop": row.get("hop_len") or 1,
                "in_doc": in_doc,
            })
    finally:
        driver.close()
    return paths_out


def _flow_propagate_reliability(
    paths: list[dict], seed_sim_map: dict, alpha: float = 0.7,
) -> list[dict]:
    """PathRAG flow-based pruning 의 단순화 버전.
    - 각 seed 노드의 초기 resource = 그 노드의 query similarity (entity 매칭 sim)
    - hop 마다 α 감쇠
    - path reliability = avg(node resources on path) × avg(relation type weight)
                        × (in_doc ? 1.5 : 1.0)
    """
    if not paths:
        return []
    # node → reliability 누적 (path 안 모든 노드의 resource 합산 평균)
    enriched = []
    for p in paths:
        nodes = p["nodes"]
        rels = p["relations"]
        # node resource: seed 면 sim, 아니면 hop 거리 기반 감쇠
        node_resources = []
        for i, n in enumerate(nodes):
            if n in seed_sim_map:
                node_resources.append(seed_sim_map[n])
            else:
                # 가장 가까운 seed 까지의 hop 추정 (간단히 전체 hop / 2)
                # 정확하진 않지만 path 내 위치 기반 감쇠라 OK
                hop_distance = min(i, len(nodes) - 1 - i) + 1
                node_resources.append(alpha ** hop_distance)
        avg_resource = sum(node_resources) / len(node_resources)
        avg_rel_w = sum(RELATION_TYPE_WEIGHT.get(r, 1.0) for r in rels) / len(rels)
        bridge = 1.5 if p.get("in_doc") else 1.0
        reliability = avg_resource * avg_rel_w * bridge
        enriched.append({**p, "reliability": reliability})
    return enriched


def _path_dedup_and_top(paths: list[dict], top_k: int) -> list[dict]:
    """Path dedup (방향 무시) 후 reliability 내림차순 top-K."""
    seen, out = set(), []
    for p in sorted(paths, key=lambda x: -x["reliability"]):
        nodes = p["nodes"]
        key = tuple(nodes) if nodes[0] <= nodes[-1] else tuple(reversed(nodes))
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
        if len(out) >= top_k:
            break
    return out


def graph_search_v3(
    query, vector_docs=None, max_paths=5, max_hops=2,
    crag_threshold=0.15,
) -> list[dict]:
    """SOTA 합성판 — LightRAG dual seed + doc-restricted 2-hop + PathRAG
    flow scoring + CRAG safety.

    반환: paths = [{nodes:[...], relations:[...], hop, reliability}, ...]
    빈 배열은 CRAG 가 graph skip 결정한 경우 (모두 reliability < threshold).
    """
    # 1. dual seed
    entity_seeds = _entity_seed_search(query, top_n=8)
    high_kws = extract_high_level_keywords(query)
    relation_seeds = _relation_seed_search(high_kws, top_m=6)

    # seed 통합 — entity 는 elementId, relation 매칭은 name 기반
    seed_node_ids = [s["node_id"] for s in entity_seeds if s.get("node_id")]
    seed_node_names = list({s["name"] for s in relation_seeds if s.get("name")})
    # name → sim 매핑 (flow 계산용). entity 검색의 name 도 포함.
    seed_sim_map = {}
    for s in entity_seeds:
        if s.get("name"):
            seed_sim_map[s["name"]] = max(seed_sim_map.get(s["name"], 0), s["sim"])
    for s in relation_seeds:
        if s.get("name"):
            seed_sim_map[s["name"]] = max(seed_sim_map.get(s["name"], 0), s["sim"])

    if not seed_node_ids and not seed_node_names:
        return []

    # 2. doc 제한 파일 set
    files = set()
    if vector_docs:
        for d in vector_docs:
            f = (d.get("source") or "").strip()
            if f:
                files.add(f)

    # 3. 2-hop path retrieval
    raw_paths = _fetch_paths_from_seeds(
        seed_node_ids, seed_node_names, files, max_hops=max_hops, limit=200,
    )
    if not raw_paths:
        return []

    # 4. PathRAG flow scoring
    scored = _flow_propagate_reliability(raw_paths, seed_sim_map, alpha=0.7)

    # 5. dedup + top-K
    top_paths = _path_dedup_and_top(scored, top_k=max_paths)

    # 6. CRAG safety: 모두 reliability 낮으면 graph skip
    if not top_paths or top_paths[0]["reliability"] < crag_threshold:
        return []

    return top_paths


def paths_to_edges(paths: list[dict]) -> list[dict]:
    """Path 리스트를 평가/로깅용 단일 edge 리스트로 풀어냄.
    eval (summarize_graph_relations) 가 {from,relation,to} 포맷 기대.
    Reliability 가 path 단위라 같은 path 의 모든 edge 가 동일 score 받음."""
    edges = []
>>>>>>> Stashed changes
    seen = set()
    keywords = extract_keywords(query)

    with driver.session() as session:
        for keyword in keywords:
            node_result = session.run("""
                MATCH (n)
                WHERE coalesce(n.name, '') CONTAINS $keyword
                    OR coalesce(n.title, '') CONTAINS $keyword
                    OR ANY(f IN coalesce(n.source_files, []) WHERE f CONTAINS $keyword)
                RETURN
                    elementId(n) AS node_id,
                    coalesce(n.name, n.title, n.file_name, '') AS node_name
                LIMIT $limit
            """, {
                "keyword": keyword,
                "limit": max_nodes_per_keyword
            })

            nodes = node_result.data()

            for node in nodes:
                node_id = node.get("node_id")
                node_name = (node.get("node_name") or "").strip()
                if not node_id or not node_name:
                    continue

                # 정방향 관계
                rel_result = session.run("""
                    MATCH (a)-[r]->(b)
                    WHERE elementId(a) = $node_id
                    RETURN
                        coalesce(a.name, a.title, a.file_name, '') AS from_node,
                        type(r) AS rel,
                        coalesce(b.name, b.title, b.file_name, '') AS to_node
                    LIMIT 10
                """, {"node_id": node_id})

                for row in rel_result.data():
                    from_node = (row.get("from_node") or "").strip()
                    rel = (row.get("rel") or "").strip()
                    to_node = (row.get("to_node") or "").strip()

                    if not from_node or not to_node:
                        continue

                    key = (from_node, rel, to_node)
                    if key not in seen:
                        results.append({
                            "from": from_node,
                            "relation": rel,
                            "to": to_node
                        })
                        seen.add(key)

<<<<<<< Updated upstream
                # 역방향 관계
                rev_result = session.run("""
                    MATCH (a)-[r]->(b)
                    WHERE elementId(b) = $node_id
                    RETURN
                        coalesce(a.name, a.title, a.file_name, '') AS from_node,
                        type(r) AS rel,
                        coalesce(b.name, b.title, b.file_name, '') AS to_node
                    LIMIT 10
                """, {"node_id": node_id})
=======
# ── Graph noise gating ──────────────────────────────────
# Failure analysis (46 H 오답 중 17건 = 37%) 결과: graph triple 이 본문과
# 무관한 다른 트랙/장학생/학번의 임계값/예외를 끌어와 LLM 이 그것을 답변에
# 인용. 예) 다중전공트랙 질문에 "졸업요건 HAS_THRESHOLD 토익 800점"
# (실제는 해외복수학위트랙 임계값) 주입 → 토익 700→800 오답.
#
# 해결: graph triple 을 prompt 에 포함하기 전, triple 의 entity 가 vector
# 검색된 본문 chunk 에 substring 으로 등장하는지 검증. 한쪽도 안 나오면 drop.
# HAS_THRESHOLD/EXCLUDES_FROM/EXCLUDES/HAS_EXCEPTION 같은 임계값/예외 관계는
# 더 엄격하게 양쪽 모두 등장 요구.
USE_GRAPH_GATING = os.getenv("USE_GRAPH_GATING", "1") == "1"  # 본문과 무관한 triple 제거
STRICT_GATING_RELS = {
    "HAS_THRESHOLD", "EXCLUDES", "EXCLUDES_FROM", "HAS_EXCEPTION",
    "SUBSTITUTES_FOR",
    "HAS_CONDITION",   # 조건 관계도 양쪽 모두 본문에 있어야 신뢰
}
>>>>>>> Stashed changes

                for row in rev_result.data():
                    from_node = (row.get("from_node") or "").strip()
                    rel = (row.get("rel") or "").strip()
                    to_node = (row.get("to_node") or "").strip()

                    if not from_node or not to_node:
                        continue

                    key = (from_node, rel, to_node)
                    if key not in seen:
                        results.append({
                            "from": from_node,
                            "relation": rel,
                            "to": to_node
                        })
                        seen.add(key)

    driver.close()
    return results[:max_relations]


# ── 결과 통합 ─────────────────────────────────────────────
def merge_results(vector_docs, graph_relations):
    """Vector + Graph 결과를 컨텍스트 문자열로 통합"""
    context_parts = []

    if vector_docs:
        vector_text = "=== 문서 검색 결과 ===\n"
        for i, doc in enumerate(vector_docs, start=1):
            vector_text += f"\n[{i}] 출처: {doc['source']} (유사도: {doc['score']})\n"
            vector_text += f"{doc['content']}\n"
        context_parts.append(vector_text.strip())

    if graph_relations:
        graph_text = "=== 관계 그래프 검색 결과 ===\n"
        for rel in graph_relations:
            if rel["from"] and rel["to"]:
                graph_text += f"- {rel['from']} --[{rel['relation']}]--> {rel['to']}\n"
        context_parts.append(graph_text.strip())

    return "\n\n".join(context_parts).strip()


# ── LLM 답변 생성 ─────────────────────────────────────────
def generate_answer(query, context, model="solar-pro"):
    """컨텍스트 기반 LLM 답변 생성"""
    if not context.strip():
        return "해당 정보를 찾을 수 없습니다."
    prompt = f"""당신은 경북대학교 컴퓨터학부 학생들을 위한 AI 챗봇입니다.
<<<<<<< Updated upstream
아래 검색된 문서 내용과 그래프 관계 정보를 바탕으로 질문에 답변하세요.
반드시 검색 결과에 근거해서만 답변하세요.
검색 결과에 없는 내용은 추측하지 말고 "해당 정보를 찾을 수 없습니다."라고 답변하세요.
=======

아래 검색 결과를 바탕으로 질문에 답변하세요. 검색 결과는 두 가지로 구성됩니다:
- [핵심 관계/조건 단서]: 지식 그래프에서 추출한 개체 간 관계 — 본문 검증/보강 *보조 자료*.
- [문서 본문]: 공지/문서의 실제 서술. **답변의 1차 근거** — 사실, 수치, 자격, 조건, 예외, 면제 모두 본문 우선.

답변 규칙:
1. **본문 우선** — 단서와 본문이 충돌하면 본문 채택. 단서만 있고 본문에 없으면 단서로 답하기 전 질문과 일치하는지 다시 확인.
2. 검색 결과에 없는 내용은 추측 금지 — "해당 정보를 찾을 수 없습니다." 답변.
3. 본문에 "면제", "예외", "단", "다만" 같은 한정/예외 조항이 있으면 절대 누락 금지.
4. **트랙 구분 (중요)**: 본문에 [다중전공트랙], [해외복수학위트랙], [학석사연계트랙] 같은 태그가 붙은 항목은 해당 트랙에만 적용되는 요건임. 질문이 특정 트랙을 묻는다면 *그 트랙 태그가 붙은 수치·조건만* 사용하고 다른 트랙의 값은 절대 혼용 금지.
5. 같은 항목(영어성적, 해외학점, 창업교과목 등)이 트랙마다 다른 값으로 나오면 질문에서 묻는 트랙의 값만 답변.
>>>>>>> Stashed changes

[검색 결과]
{context}

[질문]
{query}

[답변]
"""

    response = upstage_client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    return response.choices[0].message.content.strip()


# ── Hybrid RAG 메인 ───────────────────────────────────────
def hybrid_rag(query, use_vector=True, use_graph=True, verbose=True):
    """Hybrid RAG 파이프라인 실행"""
    if verbose:
        print(f"\n{'=' * 60}")
        print(f"[Hybrid RAG] 질문: {query}")
        print("=" * 60)

    vector_docs = []
    graph_relations = []

    if use_vector:
        try:
            vector_docs = vector_search(query, n_results=3)
            if verbose:
                print(f"\n[Vector 검색] {len(vector_docs)}개 문서 검색됨")
                for doc in vector_docs:
                    print(f"  - {doc['source']} (유사도: {doc['score']})")
        except Exception as e:
            if verbose:
                print(f"\n[Vector 검색 오류] {e}")
            vector_docs = []

    if use_graph:
        try:
<<<<<<< Updated upstream
            graph_relations = graph_search(query)
            if verbose:
                print(f"\n[Graph 검색] {len(graph_relations)}개 관계 탐색됨")
                for rel in graph_relations[:5]:
                    print(f"  - {rel['from']} --[{rel['relation']}]--> {rel['to']}")
=======
            if GRAPH_USAGE == "anchored":
                # chunk_id 브리지 기반 그래프 검색 (Document/Chunk/Entity 3계층)
                # 흐름: chunk_id → Neo4j Chunk → MENTIONS → Entity →
                #        1-hop 관계 확장 → 관련 Entity → 추가 Chunk → ChromaDB 재조회
                anchor_docs = vector_docs
                if (not USE_RERANK) and RERANK_FOR_GRAPH_ANCHOR and vector_docs:
                    try:
                        anchor_candidates = _raw_vector_search(query, n_results=RETRIEVE_K)
                        anchor_docs = llm_rerank(query, anchor_candidates, top_k=RERANK_TO_K)
                    except Exception:
                        anchor_docs = vector_docs

                graph_relations, extra_chunk_ids = chunk_anchored_graph_search(
                    anchor_docs, max_relations=3, max_extra_chunks=3,
                )
                # Regression guard: protect original top vector evidence so that
                # graph-expanded chunks cannot override or replace it.
                # Root cause of Vector-correct / Hybrid-wrong cases: reranking the
                # combined pool (vector + graph-expanded) was demoting the strongest
                # original vector results when graph chunks scored higher in rerank.
                if extra_chunk_ids:
                    extra_docs = fetch_chunks_by_ids(extra_chunk_ids)
                    seen_ids = {d["chunk_id"] for d in vector_docs if d.get("chunk_id")}
                    supplemental = []
                    for d in extra_docs:
                        if d.get("chunk_id") not in seen_ids:
                            supplemental.append(d)
                            seen_ids.add(d["chunk_id"])
                    added = len(supplemental)
                    if verbose and added:
                        print(f"\n[Graph 확장] 추가 청크 {added}개 (보조 증거)")
                    if added > 0:
                        # Lock original top-3 vector docs — never dropped or reranked.
                        protected = vector_docs[:3]
                        if USE_RERANK:
                            # Rerank only the supplemental graph-expanded docs in
                            # isolation; do not expose protected originals to a second
                            # rerank pass that could lower their effective rank.
                            supplemental = llm_rerank(query, supplemental, top_k=added)
                            if verbose:
                                print(f"[보조 증거 Rerank] {len(supplemental)}개")
                        protected_ids = {d["chunk_id"] for d in protected if d.get("chunk_id")}
                        final_extra = [d for d in supplemental if d.get("chunk_id") not in protected_ids]
                        vector_docs = protected + final_extra
                        if verbose:
                            print(f"[최종] 보호 벡터 {len(protected)}개 + 보조 {len(final_extra)}개 = {len(vector_docs)}개")
                graph_data = graph_relations
            elif USE_GRAPH_SEARCH_V3:
                graph_data = graph_search_v3(query, vector_docs=vector_docs)
                graph_relations = paths_to_edges(graph_data)
            else:
                graph_relations = graph_search(query, vector_docs=vector_docs)
                graph_data = graph_relations
            if USE_GRAPH_GATING and vector_docs:
                graph_data = gate_graph_by_body(graph_data, vector_docs)
                graph_relations = (
                    paths_to_edges(graph_data) if USE_GRAPH_SEARCH_V3 else graph_data
                )
>>>>>>> Stashed changes
        except Exception as e:
            if verbose:
                print(f"\n[Graph 검색 오류] {e}")
            graph_relations = []

    context = merge_results(vector_docs, graph_relations)
    answer = generate_answer(query, context, model = "solar-pro")

    if verbose:
        print(f"\n[최종 답변]\n{answer}")

    return {
        "query": query,
        "vector_docs": vector_docs,
        "graph_relations": graph_relations,
        "context": context,
        "answer": answer
    }


def vector_only_rag(query, verbose=True):
    """Vector 단독 RAG"""
    if verbose:
        print(f"\n{'=' * 60}")
        print(f"[Vector Only] 질문: {query}")
        print("=" * 60)

    vector_docs = vector_search(query, n_results=3)
    context = merge_results(vector_docs, [])
    answer = generate_answer(query, context, model = "solar-pro")

    if verbose:
        print(f"\n[Vector Only 답변]\n{answer}")

    return {
        "query": query,
        "vector_docs": vector_docs,
        "context": context,
        "answer": answer
    }

