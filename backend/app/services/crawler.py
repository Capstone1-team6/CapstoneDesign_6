"""Full data sync service.

The public API is still named "crawl" for frontend compatibility, but the
operation now reflects new data into search: crawl, download attachments, parse,
incrementally update Chroma and Neo4j, then clear in-process RAG caches.
"""
from __future__ import annotations

import importlib.util
import os
import subprocess
import sys
import threading
from datetime import datetime
from functools import lru_cache
from typing import Literal

from ..config import PROJECT_ROOT


CRAWLER_PATH = os.path.join(PROJECT_ROOT, "pipeline", "00_crawler.py")

SyncStep = Literal[
    "idle",
    "crawl",
    "download",
    "parse",
    "vector",
    "graph",
    "reload",
    "done",
    "error",
]

_lock = threading.Lock()
_state = {
    "running": False,
    "step": "idle",
    "message": "대기 중",
    "last_error": None,
    "started_at": None,
    "finished_at": None,
}

# 최근 동기화 로그 ring buffer — 대시보드에서 폴링해서 보여줌
_LOG_BUFFER_MAX = 200
_log_buffer: list[dict] = []


def _append_log(level: str, step: SyncStep, message: str) -> None:
    with _lock:
        _log_buffer.append({
            "ts": _now(),
            "level": level,
            "step": step,
            "message": message,
        })
        if len(_log_buffer) > _LOG_BUFFER_MAX:
            del _log_buffer[: len(_log_buffer) - _LOG_BUFFER_MAX]


def recent_logs() -> list[dict]:
    with _lock:
        return list(_log_buffer)


@lru_cache(maxsize=1)
def _load_crawler_module():
    spec = importlib.util.spec_from_file_location("crawler_module", CRAWLER_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _now() -> str:
    return datetime.utcnow().isoformat()


def _set_state(
    *,
    running: bool | None = None,
    step: SyncStep | None = None,
    message: str | None = None,
    last_error: str | None = None,
    started_at: str | None = None,
    finished_at: str | None = None,
) -> None:
    log_step: SyncStep | None = None
    log_message: str | None = None
    log_level = "info"
    with _lock:
        if running is not None:
            _state["running"] = running
        if step is not None:
            _state["step"] = step
        if message is not None:
            _state["message"] = message
        if last_error is not None or step != "error":
            _state["last_error"] = last_error
        if started_at is not None:
            _state["started_at"] = started_at
        if finished_at is not None:
            _state["finished_at"] = finished_at
        # 단계/메시지 변화 시 로그 1줄 (락 안에서 채우고 밖에서 append — re-entrancy 방지)
        if step is not None or message is not None:
            log_step = _state["step"]
            log_message = _state["message"]
            if step == "error" or last_error:
                log_level = "error"
    if log_step is not None:
        _append_log(log_level, log_step, log_message or "")


def _run_pipeline_script(
    script_name: str,
    step: SyncStep,
    message: str,
    *args: str,
) -> None:
    _set_state(step=step, message=message)
    subprocess.run(
        [sys.executable, os.path.join("pipeline", script_name), *args],
        cwd=PROJECT_ROOT,
        check=True,
    )


def _clear_rag_caches() -> None:
    _set_state(step="reload", message="검색 캐시를 새 인덱스로 갱신하는 중")
    try:
        from . import rag

        rag.clear_cache()
    except Exception as e:
        # Cache clearing is best-effort; a later process restart also refreshes it.
        print(f"[sync] RAG cache clear skipped: {type(e).__name__}: {e}")


def is_running() -> bool:
    with _lock:
        return bool(_state["running"])


def last_error() -> str | None:
    with _lock:
        return _state["last_error"]


def status() -> dict:
    with _lock:
        return {
            "running": _state["running"],
            "step": _state["step"],
            "message": _state["message"],
            "lastError": _state["last_error"],
            "startedAt": _state["started_at"],
            "finishedAt": _state["finished_at"],
        }


def run_crawl(max_pages: int = 3) -> None:
    """Backward-compatible entrypoint for the full sync pipeline."""
    run_full_sync(max_pages=max_pages)


def run_full_sync(max_pages: int = 3) -> None:
    if is_running():
        return

    _set_state(
        running=True,
        step="crawl",
        message="공지 목록을 크롤링하는 중",
        last_error=None,
        started_at=_now(),
        finished_at=None,
    )

    try:
        module = _load_crawler_module()

        notices = module.crawl(max_pages=max_pages)
        _set_state(step="download", message="첨부파일을 다운로드하는 중")
        module.download_attachments(notices)

        _run_pipeline_script("01_parser.py", "parse", "문서와 첨부파일을 파싱하는 중")
        _run_pipeline_script("02_vector_db.py", "vector", "Vector DB를 증분 갱신하는 중")
        _run_pipeline_script("03_graph_db.py", "graph", "Graph DB를 증분 갱신하는 중")
        _clear_rag_caches()

        _set_state(
            running=False,
            step="done",
            message="동기화 완료. 새 데이터가 검색에 반영되었습니다.",
            finished_at=_now(),
        )
    except Exception as e:
        err = f"{type(e).__name__}: {e}"
        _set_state(
            running=False,
            step="error",
            message="동기화 실패",
            last_error=err,
            finished_at=_now(),
        )
        raise

