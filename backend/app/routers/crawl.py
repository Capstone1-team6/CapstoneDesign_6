"""POST /api/crawl — 크롤러 트리거 (백그라운드 실행).

Body: { "maxPages"?: number }  기본 3
응답: 즉시 202 Accepted (작업 백그라운드 진행).

주의: 크롤만 갱신되고 vector/graph DB 는 stale 상태가 됨.
검색에 반영하려면 01_parser → 02_vector_db → 03_graph_db 까지 풀 파이프라인
재실행 필요 (현재는 수동).
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
        raise HTTPException(status_code=409, detail="크롤러가 이미 실행 중입니다")
    bg.add_task(crawler.run_crawl, req.maxPages)
    return {"status": "started", "maxPages": req.maxPages}


@router.get("/crawl/status")
def crawl_status():
    return {
        "running": crawler.is_running(),
        "lastError": crawler.last_error(),
    }
