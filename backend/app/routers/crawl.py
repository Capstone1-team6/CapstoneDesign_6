"""Full sync API.

The endpoint keeps the old /api/crawl name so the frontend contract stays
stable, but it now runs crawl + parse + vector build + graph build.
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi import Header
from pydantic import BaseModel

from ..config import MAX_SYNC_PAGES, SYNC_ADMIN_TOKEN
from ..services import crawler


router = APIRouter(prefix="/api", tags=["crawl"])


class CrawlRequest(BaseModel):
    maxPages: int = 3


def _verify_sync_token(token: str | None) -> None:
    if not SYNC_ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="동기화 관리자 토큰이 설정되지 않았습니다")
    if token != SYNC_ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="동기화 권한이 없습니다")


@router.post("/crawl", status_code=202)
def trigger_crawl(
    req: CrawlRequest,
    bg: BackgroundTasks,
    sync_token: str | None = Header(default=None, alias="X-Sync-Token"),
):
    _verify_sync_token(sync_token)
    if req.maxPages < 1 or req.maxPages > MAX_SYNC_PAGES:
        raise HTTPException(status_code=400, detail=f"maxPages는 1~{MAX_SYNC_PAGES} 사이여야 합니다")
    if crawler.is_running():
        raise HTTPException(status_code=409, detail="동기화가 이미 실행 중입니다")
    bg.add_task(crawler.run_full_sync, req.maxPages)
    return {"status": "started", "maxPages": req.maxPages}


@router.get("/crawl/status")
def crawl_status():
    return crawler.status()
