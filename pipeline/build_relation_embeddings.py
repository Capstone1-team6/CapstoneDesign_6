"""Relation 임베딩 빌드 — LightRAG 스타일 dual-level retrieval 의 high-level
인덱스. 이전엔 노드만 임베딩 (knu_cse_graph_nodes) 했는데, 그건 entity
("졸업요건", "복학") 매칭은 잘 잡지만 query 의 *관계 의도* ("조건은?",
"예외는?", "대체 가능?") 는 못 잡음.

LightRAG (arxiv 2410.05779) 는 query 에서 low-level (entity) + high-level
(theme/relation) 키워드를 둘 다 추출해 두 인덱스에 매칭. 우리도 22종
관계 타입을 텍스트화해서 임베딩 → high-level 키워드 매칭에 사용.

Triple text 형식: '{from} {KO_VERB} {to}' (LLM 가독 한국어)
예: '논문게재는 현장실습을 대체함' → SUBSTITUTES_FOR 매칭 가능
    '학사경고의 임계값은 평점 1.7 미만' → HAS_THRESHOLD 매칭 가능

실행: python pipeline/build_relation_embeddings.py
"""
import os
import sys

from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings
from neo4j import GraphDatabase
from langchain_upstage import UpstageEmbeddings

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")
load_dotenv(ENV_PATH)

EMBEDDING_MODEL = "embedding-passage"
COLLECTION_NAME = "knu_cse_graph_relations"
BATCH_SIZE = 64

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password1234")
UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")
if not UPSTAGE_API_KEY:
    raise RuntimeError("UPSTAGE_API_KEY 가 .env 에 없음")


# 관계 타입 → 한국어 자연어 술어 (relation text 생성용).
# 04_hybrid_rag.py 의 REL_KO 와 동일하게 유지 (단일 source of truth 는
# 04 가 아니라 데이터 빌드 단계가 더 안전 — eval 시점 코드 변경에 영향 X).
REL_KO_VERB = {
    "REQUIRES":         "는 다음을 요구함:",
    "HAS_DEADLINE":     "의 마감일:",
    "HAS_CONDITION":    "의 조건:",
    "HAS_THRESHOLD":    "의 임계값:",
    "HAS_EXCEPTION":    "의 예외:",
    "SUBSTITUTES_FOR":  "는 다음을 대체함:",
    "ALTERNATIVE_PATH": "와 동등한 경로:",
    "EXCLUDES_FROM":    "는 다음에서 제외됨:",
    "TARGETS":          "의 대상:",
    "PROVIDES":         "는 다음을 제공함:",
    "OFFERS":           "는 다음을 제공:",
    "INCLUDES":         "는 다음을 포함:",
    "REWARDS":          "는 다음에 보상함:",
    "CHARGES":          "는 다음에 비용 부과:",
    "PART_OF":          "는 다음의 일부:",
    "BELONGS_TO":       "는 다음에 속함:",
    "APPLIES_TO":       "는 다음에 적용됨:",
    "EXCLUDES":         "는 다음을 제외:",
    "RELATED_TO":       "는 관련됨:",
    "ACCEPTS":          "는 다음을 수용:",
    "REFERS":           "는 다음을 참조:",
}

# MENTIONS 는 메타관계라 인덱싱 제외 (Document → Entity 자동)
MEANINGFUL_RELATIONS = list(REL_KO_VERB.keys())


def fetch_relations() -> list[dict]:
    """Neo4j 의 의미 관계 (MENTIONS 제외) 추출.
    각 항목: id (relationship elementId), from, rel, to, source_files."""
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    rels = []
    try:
        with driver.session() as session:
            rows = session.run("""
                MATCH (a)-[r]->(b)
                WHERE NOT a:Document AND NOT b:Document
                  AND coalesce(a.name, '') <> '' AND coalesce(b.name, '') <> ''
                  AND type(r) IN $types
                RETURN
                    elementId(r) AS id,
                    a.name AS from_name,
                    type(r) AS rel,
                    b.name AS to_name,
                    coalesce(a.source_files, []) AS a_files,
                    coalesce(b.source_files, []) AS b_files
            """, {"types": MEANINGFUL_RELATIONS}).data()
            for r in rows:
                # 양쪽 노드 source_files 의 합집합 (path 가 어느 문서에서
                # 등장하는지 모두 보존). dedup 유지.
                files = list(dict.fromkeys(
                    list(r.get("a_files") or []) + list(r.get("b_files") or [])
                ))
                rels.append({
                    "id": r["id"],
                    "from": r["from_name"].strip(),
                    "rel": r["rel"].strip(),
                    "to": r["to_name"].strip(),
                    "source_files": files,
                })
    finally:
        driver.close()
    return rels


def relation_to_text(rel: dict) -> str:
    """Triple → 임베딩용 자연어 한국어 문장.
    예: '논문게재는 다음을 대체함: 현장실습'
    high-level keyword ('대체', '조건', '예외') 가 술어와 직접 매칭됨.
    """
    verb = REL_KO_VERB.get(rel["rel"], f"--[{rel['rel']}]-->")
    return f"{rel['from']} {verb} {rel['to']}"


def main():
    print(f"[설정] embedding={EMBEDDING_MODEL}, collection={COLLECTION_NAME}")

    rels = fetch_relations()
    print(f"\n[Neo4j] 의미 관계 {len(rels)}개 추출 (MENTIONS 제외)")

    if not rels:
        print("[경고] 관계 없음 — graph DB 빌드 먼저 필요")
        return

    texts = [relation_to_text(r) for r in rels]
    sample = texts[:3]
    print("  샘플:")
    for s in sample:
        print(f"    - {s[:120]}")

    embedding_fn = UpstageEmbeddings(model=EMBEDDING_MODEL, api_key=UPSTAGE_API_KEY)
    client = chromadb.PersistentClient(
        path=CHROMA_DIR, settings=Settings(anonymized_telemetry=False)
    )

    if COLLECTION_NAME in list(client.list_collections()):
        print(f"[초기화] 기존 컬렉션 '{COLLECTION_NAME}' 삭제")
        client.delete_collection(COLLECTION_NAME)
    coll = client.create_collection(COLLECTION_NAME)

    print(f"[임베딩] {len(rels)}개 관계 batch={BATCH_SIZE}")
    for start in range(0, len(rels), BATCH_SIZE):
        batch_rels = rels[start:start + BATCH_SIZE]
        batch_texts = texts[start:start + BATCH_SIZE]
        embeddings = embedding_fn.embed_documents(batch_texts)
        coll.add(
            ids=[r["id"] for r in batch_rels],
            embeddings=embeddings,
            documents=batch_texts,
            # metadata: from/to 노드명 + 관계 타입 + source files 첫 2개
            # (Chroma metadata 는 list 직접 저장 안 됨 → "|" join)
            metadatas=[
                {
                    "from_name": r["from"],
                    "to_name": r["to"],
                    "rel_type": r["rel"],
                    "source_files": "|".join(r["source_files"][:5]),
                }
                for r in batch_rels
            ],
        )
        print(f"  batch {start // BATCH_SIZE + 1}: {start+1}-{start+len(batch_rels)} / {len(rels)}")

    print(f"\n[완료] '{COLLECTION_NAME}' 컬렉션 {coll.count()}개 관계 임베딩")


if __name__ == "__main__":
    main()
