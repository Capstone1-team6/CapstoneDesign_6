"""크롤러 서비스 — pipeline/00_crawler.py 의 crawl() 을 동적 import 해서 호출.

주의: 크롤만 하면 notices.json 만 갱신되고 vector/graph DB 는 stale 상태.
실제 검색에 반영하려면 01_parser → 02_vector_db → 03_graph_db 까지 풀 파이프라인
재실행 필요. MVP 는 크롤만 노출하고 풀 파이프라인은 수동.
"""
import os
import importlib.util
from functools import lru_cache

from ..config import PROJECT_ROOT


CRAWLER_PATH = os.path.join(PROJECT_ROOT, "pipeline", "00_crawler.py")

_state = {"running": False, "last_error": None}


@lru_cache(maxsize=1)
def _load_crawler_module():
    spec = importlib.util.spec_from_file_location("crawler_module", CRAWLER_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def is_running() -> bool:
    return _state["running"]


def last_error() -> str | None:
    return _state["last_error"]


def run_crawl(max_pages: int = 3) -> None:
    """동기 크롤 실행. BackgroundTasks 에서 호출되어 백그라운드 스레드에서 돈다."""
    if _state["running"]:
        return
    _state["running"] = True
    _state["last_error"] = None
    try:
        module = _load_crawler_module()
        module.crawl(max_pages=max_pages)
    except Exception as e:
        _state["last_error"] = f"{type(e).__name__}: {e}"
        raise
    finally:
        _state["running"] = False
