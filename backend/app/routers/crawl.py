"""Full sync API.

The endpoint keeps the old /api/crawl name so the frontend contract stays
stable, but it now runs crawl + parse + vector build + graph build.
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from ..services import crawler


router = APIRouter(prefix="/api", tags=["crawl"])


class CrawlRequest(BaseModel):
    maxPages: int = 3


@router.post("/crawl", status_code=202)
def trigger_crawl(req: CrawlRequest, bg: BackgroundTasks):
    if crawler.is_running():
        raise HTTPException(status_code=409, detail="동기화가 이미 실행 중입니다")
    bg.add_task(crawler.run_full_sync, req.maxPages)
    return {"status": "started", "maxPages": req.maxPages}


@router.get("/crawl/status")
def crawl_status():
    return crawler.status()
