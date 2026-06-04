"""GET /api/meta — 마지막 크롤링 시각 + 총 공지 수."""
import os
import json
from datetime import datetime

from fastapi import APIRouter

from ..config import NOTICES_JSON_PATH


router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/meta")
def meta():
    last_crawled_at = ""
    total = 0
    if os.path.exists(NOTICES_JSON_PATH):
        # 크롤러가 별도 timestamp 를 남기지 않아 파일 mtime 으로 대체
        mtime = os.path.getmtime(NOTICES_JSON_PATH)
        last_crawled_at = datetime.fromtimestamp(mtime).isoformat()
        try:
            with open(NOTICES_JSON_PATH, encoding="utf-8") as f:
                total = len(json.load(f))
        except Exception:
            total = 0
    return {
        "lastCrawledAt": last_crawled_at,
        "totalAnnouncements": total,
    }
