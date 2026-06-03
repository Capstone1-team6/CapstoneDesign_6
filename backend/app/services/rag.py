"""RAG 서비스 — pipeline/04_hybrid_rag.py 를 동적 import 해서 호출하고
프론트의 AnnouncementSource 형식으로 결과를 변환한다.
"""
import os
import json
import importlib.util
from functools import lru_cache
from typing import Any

from ..config import HYBRID_RAG_PATH, NOTICES_JSON_PATH
from .graph_layout import graph_relations_to_knowledge_graph


@lru_cache(maxsize=1)
def _load_hybrid_module():
    """pipeline/04_hybrid_rag.py 동적 로드 (파일명이 숫자로 시작해서 일반 import 불가)."""
    spec = importlib.util.spec_from_file_location("hybrid_rag_module", HYBRID_RAG_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@lru_cache(maxsize=1)
def _load_notices_index() -> dict[str, dict]:
    """notices.json 을 wr_id와 num 키로 인덱싱. url/date/title 조회용."""
    if not os.path.exists(NOTICES_JSON_PATH):
        return {}
    with open(NOTICES_JSON_PATH, encoding="utf-8") as f:
        notices = json.load(f)

    index: dict[str, dict] = {}
    for notice in notices:
        num = str(notice.get("num", "")).strip()
        if num:
            index[num] = notice
        wr_id = str(notice.get("wr_id", "")).strip()
        if not wr_id:
            try:
                wr_id = notice.get("url", "").split("wr_id=")[1].split("&")[0]
            except IndexError:
                wr_id = ""
        if wr_id:
            index[wr_id] = notice
    return index


def _make_summary(content: str, max_len: int = 120) -> str:
    """chunk content 의 첫 문장(또는 앞 N자) 을 요약으로."""
    if not content:
        return ""
    text = content.strip().replace("\n", " ")
    # 마침표·물음표·느낌표로 첫 문장 자르기
    for sep in ["。", ". ", "? ", "! "]:
        idx = text.find(sep)
        if 10 <= idx <= max_len:
            return text[: idx + 1].strip()
    return text[:max_len].strip() + ("..." if len(text) > max_len else "")


def _doc_to_source(doc: dict, notices_index: dict[str, dict]) -> dict:
    """vector_docs 항목 → AnnouncementSource dict.

    chroma metadata 를 우선 사용하고, 없으면 doc_key 에서 파싱:
      manual::파일명          → source_type=manual
      notice::wr_id::파일명    → source_type=notice, notice_id=wr_id
      notice_content::wr_id    → source_type=notice_content, notice_id=wr_id
    """
    doc_key = doc.get("doc_key", "") or ""
    chunk_id = doc.get("chunk_id", "") or ""
    file_name = doc.get("source", "") or ""
    content = doc.get("content", "") or ""

    parts = doc_key.split("::")
    source_type = doc.get("source_type") or (parts[0] if parts else "")
    notice_id = str(doc.get("notice_id") or "").strip()
    if not notice_id and source_type in {"notice", "notice_content"} and len(parts) >= 2:
        notice_id = parts[1]
    notice_num = str(doc.get("notice_num") or "").strip()

    notice_meta = notices_index.get(notice_id, {}) or notices_index.get(notice_num, {})

    if source_type in {"notice", "notice_content"}:
        title = doc.get("notice_title") or notice_meta.get("title") or file_name
        url = notice_meta.get("url") or doc.get("url") or ""
        published_at = doc.get("date") or notice_meta.get("date") or ""
        category = "공지"
    else:
        title = file_name or "매뉴얼"
        url = ""
        published_at = doc.get("date") or ""
        category = "매뉴얼"

    source_id = chunk_id or doc_key or url or title or file_name

    return {
        "id": source_id,
        "title": title,
        "category": category,
        "summary": _make_summary(content),
        "publishedAt": published_at,
        "url": url,
    }


def clear_cache() -> None:
    """Clear cached RAG module and notice metadata after index rebuilds."""
    _load_hybrid_module.cache_clear()
    _load_notices_index.cache_clear()


def run_hybrid_rag(query: str) -> dict[str, Any]:
    """hybrid_rag 호출 후 프론트가 쓰는 형태로 정리해서 반환.

    반환:
      { "answer": str, "sources": list[AnnouncementSource] }
    """
    module = _load_hybrid_module()
    result = module.hybrid_rag(query, verbose=False)

    notices_index = _load_notices_index()
    raw_docs = result.get("vector_docs", []) or []

    # 동일 doc_key 는 dedup — 같은 문서의 여러 chunk 가 sources 에 여러 번 노출되면 UI 가 지저분함
    seen: set[str] = set()
    sources: list[dict] = []
    for d in raw_docs:
        src = _doc_to_source(d, notices_index)
        key = (src["url"] or src["title"]).strip()
        if key in seen:
            continue
        seen.add(key)
        sources.append(src)

    knowledge_graph = graph_relations_to_knowledge_graph(
        result.get("graph_relations", []) or [],
        query=query,
    )

    return {
        "answer": result.get("answer", "") or "",
        "sources": sources,
        "knowledge_graph": knowledge_graph,  # None 가능
    }
