"""Vector DB 빌드 (Chroma) — 공지 본문 + 공지 첨부파일을 청킹해서 임베딩.

chunk_id 형식: {source_type}::{doc_key}::chunk{i}
  - 로딩 순서에 무관한 안정적 ID (03_graph_db.py 와 동일 규칙 공유)
  - 예) notice::29121::2026년_공고문.pdf::chunk0
        notice_content::29121::chunk0

실행: python pipeline/02_vector_db.py
"""
import os
import sys
import json
import hashlib

from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings
from langchain_upstage import UpstageEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Windows cp949 콘솔 대응
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
PARSED_DIR = os.path.join(BASE_DIR, "data", "parsed")
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")
VECTOR_STATE_PATH = os.path.join(BASE_DIR, "data", "vector_state.json")
load_dotenv(ENV_PATH)

# ── 청킹 / 임베딩 설정 ──
CHUNK_SIZE = 800
CHUNK_OVERLAP = 150
MIN_CHUNK_LEN = 20
EMBEDDING_MODEL = "embedding-passage"
COLLECTION_NAME = "knu_cse_upstage_pro"
BATCH_SIZE = 64

UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")
if not UPSTAGE_API_KEY:
    raise RuntimeError("UPSTAGE_API_KEY 가 .env 에 없음")


def include_manual_files() -> bool:
    """평가/실험용 수동 문서는 명시적으로 켠 경우에만 웹 인덱스에 포함한다."""
    return os.getenv("INCLUDE_MANUAL_FILES", "").lower() in {"1", "true", "yes", "on"}


def get_notice_id(notice: dict) -> str:
    """게시글 고유 ID. 목록 번호(num)는 중복될 수 있어 wr_id를 우선 사용한다."""
    wr_id = str(notice.get("wr_id") or "").strip()
    if wr_id:
        return wr_id
    url = notice.get("url", "")
    try:
        return url.split("wr_id=")[1].split("&")[0]
    except IndexError:
        return str(notice.get("num") or "unknown")


# ── chunk_id 생성 (03_graph_db.py 와 동일 규칙) ─────────────
def make_doc_key(source_type: str, file_name: str, notice_id: str = "") -> str:
    """문서의 고유 키. chunk_id 생성에 사용."""
    if source_type == "manual":
        return f"manual::{file_name}"
    elif source_type == "notice":
        return f"notice::{notice_id}::{file_name}"
    elif source_type == "notice_content":
        return f"notice_content::{notice_id}"
    return f"{source_type}::{file_name}"


def make_chunk_id(doc_key: str, chunk_index: int) -> str:
    return f"{doc_key}::chunk{chunk_index}"


def indexed_text(doc: dict) -> str:
    title = doc.get("notice_title", "")
    return f"[{title}]\n{doc['parsed_text']}" if title else doc["parsed_text"]


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_vector_state() -> dict:
    if not os.path.exists(VECTOR_STATE_PATH):
        return {}
    try:
        with open(VECTOR_STATE_PATH, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def save_vector_state(state: dict) -> None:
    os.makedirs(os.path.dirname(VECTOR_STATE_PATH), exist_ok=True)
    with open(VECTOR_STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2, sort_keys=True)


# ── 문서 로드 ────────────────────────────────────────────────
def load_documents() -> list[dict]:
    """공지 첨부파일 + 공지 본문을 단일 list 로 평탄화.
    각 항목: {doc_key, file_name, source_type, parsed_text, (notice_title), (date), (notice_num)}.
    """
    docs = []

    manual_path = os.path.join(PARSED_DIR, "manual_parsed.json")
    if include_manual_files() and os.path.exists(manual_path):
        with open(manual_path, encoding="utf-8") as f:
            for m in json.load(f):
                text = (m.get("parsed_text") or "").strip()
                if not text:
                    continue
                file_name = m.get("file_name", "unknown")
                docs.append({
                    "doc_key": make_doc_key("manual", file_name),
                    "file_name": file_name,
                    "source_type": "manual",
                    "parsed_text": text,
                })

    notices_path = os.path.join(PARSED_DIR, "notices_parsed.json")
    if os.path.exists(notices_path):
        with open(notices_path, encoding="utf-8") as f:
            seen_ids: set[str] = set()
            for n in json.load(f):
                notice_id = get_notice_id(n)
                num = str(n.get("num") or "").strip()
                if notice_id in seen_ids:
                    continue
                seen_ids.add(notice_id)

                title = (n.get("title") or "").strip()
                date = (n.get("date") or "").strip()

                # 첨부파일
                for a in n.get("attachments", []):
                    text = (a.get("parsed_text") or "").strip()
                    if not text:
                        continue
                    att_name = a.get("name", "unknown")
                    docs.append({
                        "doc_key": make_doc_key("notice", att_name, notice_id),
                        "file_name": att_name,
                        "source_type": "notice",
                        "notice_title": title,
                        "notice_id": notice_id,
                        "notice_num": num,
                        "date": date,
                        "parsed_text": text,
                    })

                # 공지 본문(content)
                content = (n.get("content") or "").strip()
                if content:
                    docs.append({
                        "doc_key": make_doc_key("notice_content", "", notice_id),
                        "file_name": f"notice_{notice_id}",
                        "source_type": "notice_content",
                        "notice_title": title,
                        "notice_id": notice_id,
                        "notice_num": num,
                        "date": date,
                        "parsed_text": content,
                    })

    return docs


# ── 청킹 ─────────────────────────────────────────────────────
def chunk_documents(docs: list[dict]) -> list[dict]:
    """RecursiveCharacterTextSplitter 로 청크 분할.
    - chunk_id: make_chunk_id(doc_key, i) — 순서 독립적, Neo4j 와 공유
    - 공지 제목 prepend — 임베딩에 제목 의미 반영
    - MIN_CHUNK_LEN 미만 청크 제거
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=[
            "\n\n",
            "\n## ", "\n# ",
            "\n가. ", "\n나. ", "\n다. ", "\n라. ", "\n마. ",
            "\n1) ", "\n2) ", "\n3) ", "\n4) ", "\n5) ",
            "\n① ", "\n② ", "\n③ ", "\n④ ", "\n⑤ ",
            "\n- ", "\n* ",
            "\n",
            ". ", "。", "! ", "? ",
            " ", ""
        ],
        length_function=len,
    )

    chunks = []
    skipped = 0
    for doc in docs:
        title = doc.get("notice_title", "")
        text = indexed_text(doc)
        doc_key = doc["doc_key"]

        for i, chunk_text in enumerate(splitter.split_text(text)):
            if len(chunk_text) < MIN_CHUNK_LEN:
                skipped += 1
                continue
            chunks.append({
                "id": make_chunk_id(doc_key, i),
                "text": chunk_text,
                "metadata": {
                    "doc_key": doc_key,
                    "file_name": doc["file_name"],
                    "source_type": doc["source_type"],
                    "chunk_index": i,
                    **({"notice_title": title} if title else {}),
                    **({"notice_id": doc["notice_id"]} if doc.get("notice_id") else {}),
                    **({"notice_num": doc["notice_num"]} if doc.get("notice_num") else {}),
                    **({"date": doc["date"]} if doc.get("date") else {}),
                },
            })

    if skipped:
        print(f"  (짧은 청크 {skipped}개 제거됨, 기준: {MIN_CHUNK_LEN}자 미만)")
    return chunks


def main():
    print(f"[config] chunk_size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP}, min_len={MIN_CHUNK_LEN}")
    print(f"[config] embedding={EMBEDDING_MODEL}, collection={COLLECTION_NAME}")

    docs = load_documents()
    manual_docs = sum(1 for d in docs if d["source_type"] == "manual")
    att_docs = sum(1 for d in docs if d["source_type"] == "notice")
    content_docs = sum(1 for d in docs if d["source_type"] == "notice_content")
    print(
        f"\n[load] docs={len(docs)} "
        f"(manual={manual_docs}, attachments={att_docs}, notice_content={content_docs})"
    )

    embedding_fn = UpstageEmbeddings(model=EMBEDDING_MODEL, api_key=UPSTAGE_API_KEY)

    client = chromadb.PersistentClient(
        path=CHROMA_DIR, settings=Settings(anonymized_telemetry=False)
    )

    try:
        coll = client.get_collection(COLLECTION_NAME)
    except Exception:
        coll = client.create_collection(COLLECTION_NAME)

    state = load_vector_state()
    try:
        existing_ids = set(coll.get()["ids"])
    except Exception:
        existing_ids = set()

    docs_to_index = []
    skipped_docs = 0
    for doc in docs:
        doc_key = doc["doc_key"]
        doc_hash = content_hash(indexed_text(doc))
        doc_chunks = chunk_documents([doc])
        expected_ids = [c["id"] for c in doc_chunks]

        if state.get(doc_key) == doc_hash and all(i in existing_ids for i in expected_ids):
            skipped_docs += 1
            continue
        if doc_key not in state and expected_ids and all(i in existing_ids for i in expected_ids):
            state[doc_key] = doc_hash
            skipped_docs += 1
            continue

        docs_to_index.append((doc, doc_hash, doc_chunks))

    chunks = []
    for doc, doc_hash, doc_chunks in docs_to_index:
        doc_key = doc["doc_key"]
        try:
            coll.delete(where={"doc_key": doc_key})
        except Exception:
            pass
        for chunk in doc_chunks:
            chunk["metadata"]["doc_hash"] = doc_hash
        chunks.extend(doc_chunks)

    print(f"[incremental] docs={len(docs)} skipped={skipped_docs} indexing={len(docs_to_index)}")
    print(f"[chunks] {len(chunks)} chunks to embed")
    if chunks:
        lens = [len(c["text"]) for c in chunks]
        print(f"  length avg={sum(lens)//len(lens)} min={min(lens)} max={max(lens)}")

    print(f"[embedding] process {len(chunks)} chunks with batch={BATCH_SIZE}")
    for start in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[start:start + BATCH_SIZE]
        texts = [c["text"] for c in batch]
        embeddings = embedding_fn.embed_documents(texts)
        coll.add(
            ids=[c["id"] for c in batch],
            embeddings=embeddings,
            documents=texts,
            metadatas=[c["metadata"] for c in batch],
        )
        print(f"  batch {start // BATCH_SIZE + 1}: {start+1}-{start+len(batch)} / {len(chunks)}")

    for doc, doc_hash, _ in docs_to_index:
        state[doc["doc_key"]] = doc_hash
    save_vector_state(state)

    print(f"\n[done] collection '{COLLECTION_NAME}' has {coll.count()} chunks")

if __name__ == "__main__":
    main()

