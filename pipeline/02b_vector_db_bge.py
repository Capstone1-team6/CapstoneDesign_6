"""Vector DB 빌드 — BGE-m3-ko (dragonkue) 임베딩 사용.

기존 02_vector_db.py 는 Upstage embedding-passage 사용 (collection
'knu_cse_upstage_pro'). 이 파일은 한국어 특화 BGE-m3-ko 로 별도 collection
'knu_cse_bge_m3_ko' 빌드 — A/B 비교 + 롤백 가능.

근거 — AutoRAG Korean Embedding Benchmark Top-1: dragonkue/bge-m3-ko
0.7456 (Upstage 0.6579 대비 +8.77pt). MIRACL-ko nDCG@10 0.683.
출처: https://huggingface.co/dragonkue/bge-m3-ko

실행:
  python pipeline/02b_vector_db_bge.py        # 빌드
  EMBED_BACKEND=bge python evaluation/evaluate.py   # 평가 시 BGE 사용
"""
import os
import sys
import json

from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
PARSED_DIR = os.path.join(BASE_DIR, "data", "parsed")
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")
load_dotenv(ENV_PATH)

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
EMBEDDING_MODEL_NAME = "dragonkue/bge-m3-ko"
COLLECTION_NAME = "knu_cse_bge_m3_ko"
BATCH_SIZE = 32  # GPU 없을 때 CPU 인코딩 — batch 작게


def load_documents() -> list[dict]:
    docs = []
    manual_path = os.path.join(PARSED_DIR, "manual_parsed.json")
    if os.path.exists(manual_path):
        with open(manual_path, encoding="utf-8") as f:
            for m in json.load(f):
                text = (m.get("parsed_text") or "").strip()
                if text:
                    docs.append({
                        "file_name": m.get("file_name", "unknown"),
                        "source_type": "manual",
                        "parsed_text": text,
                    })
    notices_path = os.path.join(PARSED_DIR, "notices_parsed.json")
    if os.path.exists(notices_path):
        with open(notices_path, encoding="utf-8") as f:
            for n in json.load(f):
                title = (n.get("title") or "").strip()
                for a in n.get("attachments", []):
                    text = (a.get("parsed_text") or "").strip()
                    if not text:
                        continue
                    docs.append({
                        "file_name": a.get("name", "unknown"),
                        "source_type": "notice",
                        "notice_title": title,
                        "parsed_text": text,
                    })
    return docs


def chunk_documents(docs: list[dict]) -> list[dict]:
    """02_vector_db.py 와 동일한 한국 행정 문서 separator 사용."""
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
    for doc_idx, doc in enumerate(docs):
        text = doc["parsed_text"]
        for i, chunk_text in enumerate(splitter.split_text(text)):
            chunks.append({
                "id": f"d{doc_idx:04d}::{doc['file_name']}::chunk{i}",
                "text": chunk_text,
                "metadata": {
                    "file_name": doc["file_name"],
                    "source_type": doc["source_type"],
                    "chunk_index": i,
                    "doc_index": doc_idx,
                    **({"notice_title": doc["notice_title"]}
                       if "notice_title" in doc else {}),
                },
            })
    return chunks


def main():
    print(f"[설정] chunk_size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP}")
    print(f"[설정] embedding={EMBEDDING_MODEL_NAME}, collection={COLLECTION_NAME}")

    docs = load_documents()
    print(f"\n[로드] 문서 {len(docs)}개")

    chunks = chunk_documents(docs)
    print(f"[청킹] 청크 {len(chunks)}개")
    if chunks:
        lens = [len(c["text"]) for c in chunks]
        print(f"  길이 평균 {sum(lens)//len(lens)}자, 최소 {min(lens)}, 최대 {max(lens)}")

    print(f"\n[모델 로드] {EMBEDDING_MODEL_NAME}")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    print(f"  device: {model.device}, embedding dim: {model.get_sentence_embedding_dimension()}")

    client = chromadb.PersistentClient(
        path=CHROMA_DIR, settings=Settings(anonymized_telemetry=False)
    )
    if COLLECTION_NAME in list(client.list_collections()):
        print(f"[초기화] 기존 컬렉션 '{COLLECTION_NAME}' 삭제")
        client.delete_collection(COLLECTION_NAME)
    coll = client.create_collection(COLLECTION_NAME)

    print(f"[임베딩] {len(chunks)}개 chunk 를 batch={BATCH_SIZE} 로 처리")
    for start in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[start:start + BATCH_SIZE]
        texts = [c["text"] for c in batch]
        # sentence-transformers 는 numpy 반환 → tolist() 로 chroma 호환
        embeddings = model.encode(
            texts,
            batch_size=BATCH_SIZE,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,  # cosine 유사도용 정규화
        ).tolist()
        coll.add(
            ids=[c["id"] for c in batch],
            embeddings=embeddings,
            documents=texts,
            metadatas=[c["metadata"] for c in batch],
        )
        print(f"  batch {start // BATCH_SIZE + 1}: {start+1}-{start+len(batch)} / {len(chunks)}")

    print(f"\n[완료] '{COLLECTION_NAME}' 컬렉션 {coll.count()}개 chunk")


if __name__ == "__main__":
    main()
