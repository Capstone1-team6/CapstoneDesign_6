"""GET /api/stats — 데이터 수집 모니터링용 통계.

notices.json 을 집계해서 대시보드에 필요한 수치를 반환.
별도 DB 없이 raw 파일만 읽는다 (가벼움 + 매번 최신값).
"""
import os
import json
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter

from ..config import NOTICES_JSON_PATH
from ..services import crawler


router = APIRouter(prefix="/api", tags=["stats"])


# 키워드 기반 카테고리 매핑 (notices.json 에 category 필드가 없어서 제목으로 추정)
CATEGORY_KEYWORDS: list[tuple[str, list[str]]] = [
    ("장학",   ["장학", "학자금", "근로장학"]),
    ("학사",   ["수강", "졸업", "성적", "학적", "전과", "복수전공", "부전공", "학위"]),
    ("취업",   ["취업", "채용", "기업", "인턴", "공채", "면접"]),
    ("행사",   ["행사", "공모", "대회", "경진", "세미나", "특강", "박람회"]),
    ("기숙사", ["기숙사", "생활관", "BTL"]),
    ("국제",   ["해외", "교환", "글로벌", "international"]),
]


def _categorize(title: str) -> str:
    if not title:
        return "기타"
    t = title.lower()
    for cat, kws in CATEGORY_KEYWORDS:
        if any(kw.lower() in t for kw in kws):
            return cat
    return "기타"


@router.get("/stats")
def stats():
    if not os.path.exists(NOTICES_JSON_PATH):
        return {
            "totalNotices": 0,
            "totalAttachments": 0,
            "categoryDistribution": [],
            "timeline": [],
            "latestNotices": [],
            "lastCrawledAt": "",
            "syncStatus": crawler.status(),
        }

    with open(NOTICES_JSON_PATH, encoding="utf-8") as f:
        notices = json.load(f)

    total_att = sum(len(n.get("attachments", []) or []) for n in notices)

    # 카테고리 분포
    cat_count: dict[str, int] = defaultdict(int)
    for n in notices:
        cat_count[_categorize(n.get("title", ""))] += 1
    category_distribution = [
        {"category": k, "count": v}
        for k, v in sorted(cat_count.items(), key=lambda kv: kv[1], reverse=True)
    ]

    # 타임라인 (최근 30일 일자별)
    date_count: dict[str, int] = defaultdict(int)
    for n in notices:
        d = (n.get("date") or "").strip()
        if d:
            date_count[d] += 1
    today = datetime.utcnow().date()
    timeline = []
    for i in range(29, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        timeline.append({"date": d, "count": date_count.get(d, 0)})

    # 최신 공지 10건 (date 기준 내림차순)
    sorted_notices = sorted(
        notices,
        key=lambda n: (n.get("date") or ""),
        reverse=True,
    )
    latest = [
        {
            "num": n.get("num", ""),
            "title": n.get("title", ""),
            "date": n.get("date", ""),
            "url": n.get("url", ""),
            "category": _categorize(n.get("title", "")),
            "attachmentCount": len(n.get("attachments", []) or []),
        }
        for n in sorted_notices[:10]
    ]

    last_crawled_at = ""
    try:
        mtime = os.path.getmtime(NOTICES_JSON_PATH)
        last_crawled_at = datetime.fromtimestamp(mtime).isoformat()
    except Exception:
        pass

    return {
        "totalNotices": len(notices),
        "totalAttachments": total_att,
        "categoryDistribution": category_distribution,
        "timeline": timeline,
        "latestNotices": latest,
        "lastCrawledAt": last_crawled_at,
        "syncStatus": crawler.status(),
    }


@router.get("/crawl/logs")
def crawl_logs():
    """최근 크롤/파이프라인 로그 (ring buffer)."""
    return {"logs": crawler.recent_logs()}
