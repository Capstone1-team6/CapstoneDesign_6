import requests
from bs4 import BeautifulSoup
import json
import os
import time
import re
from urllib.parse import urljoin

CSE_BASE_URL = "https://cse.knu.ac.kr/bbs/board.php"
CSE_PARAMS = {"bo_table": "sub5_1", "lang": "kor"}
KNU_BASE_URL = "https://www.knu.ac.kr"
KNU_BOARD_URL = f"{KNU_BASE_URL}/wbbs/wbbs/bbs/btin/list.action"
KNU_PARAMS = {"bbs_cde": "1", "menu_idx": "67"}
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://cse.knu.ac.kr"
}

OUTPUT_DIR = "./data/raw"
ATTACHMENT_DIR = "./data/attachments"
NOTICES_PATH = os.path.join(OUTPUT_DIR, "notices.json")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ATTACHMENT_DIR, exist_ok=True)

# 세션 유지: 그누보드는 다운로드 시 세션 쿠키를 검증함
session = requests.Session()
session.headers.update(HEADERS)


def notice_id(notice):
    wr_id = str(notice.get("wr_id") or "").strip()
    if wr_id:
        return wr_id
    url = notice.get("url", "")
    try:
        return url.split("wr_id=")[1].split("&")[0]
    except IndexError:
        return ""


def safe_notice_dir(notice):
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", notice_id(notice) or "unknown")


def load_existing_notices():
    if not os.path.exists(NOTICES_PATH):
        return []
    try:
        with open(NOTICES_PATH, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"[warning] failed to load existing notices.json: {e}")
        return []


def merge_notices(new_notices, existing_notices):
    merged = {}
    order = []

    for notice in new_notices:
        key = notice_id(notice)
        if not key:
            continue
        merged[key] = notice
        order.append(key)

    for notice in existing_notices:
        key = notice_id(notice)
        if not key or key in merged:
            continue
        merged[key] = notice
        order.append(key)

    return [merged[key] for key in order]


def get_cse_notice_list(page=1):
    """공지사항 목록 한 페이지 크롤링"""
    params = {**CSE_PARAMS, "page": page}
    try:
        res = session.get(CSE_BASE_URL, params=params, timeout=10)
        res.raise_for_status()
        return res.text
    except requests.exceptions.RequestException as e:
        print(f"[오류] 목록 페이지 {page} 요청 실패: {e}")
        return None


def parse_cse_notice_list(html):
    """목록 페이지에서 게시글 링크와 제목 추출"""
    soup = BeautifulSoup(html, "html.parser")
    notices = []

    rows = soup.select("table tbody tr")
    for row in rows:
        title_div = row.select_one("div.bo_tit")
        if not title_div:
            continue

        target_link = None
        for a in title_div.select("a"):
            if "wr_id" in a.get("href", ""):
                target_link = a
                break

        if not target_link:
            continue

        title = target_link.get_text(strip=True)
        href = target_link.get("href", "")
        url = href if href.startswith("http") else "https://cse.knu.ac.kr" + href
        try:
            wr_id = url.split("wr_id=")[1].split("&")[0]
        except IndexError:
            wr_id = ""

        date_td = row.select_one("td.td_datetime")
        date = date_td.get_text(strip=True) if date_td else ""

        num_td = row.select_one("td.td_num2")
        num = num_td.get_text(strip=True) if num_td else ""

        notices.append({
            "num": num,
            "wr_id": wr_id,
            "source": "cse",
            "title": title,
            "url": url,
            "date": date
        })

    return notices


def get_cse_notice_detail(url):
    """게시글 상세 내용 + 첨부파일 URL 수집"""
    try:
        res = session.get(url, timeout=10)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")

        # 본문
        content_tag = soup.select_one("#bo_v_con")
        content = content_tag.get_text(separator="\n", strip=True) if content_tag else ""

        # 첨부파일
        attachments = []
        file_section = soup.select_one("section#bo_v_file")
        if file_section:
            for a_tag in file_section.select("a.view_file_download"):
                file_url = a_tag.get("href", "")
                strong_tag = a_tag.select_one("strong")
                file_name = strong_tag.get_text(strip=True) if strong_tag else a_tag.get_text(strip=True)
                if file_url:
                    attachments.append({
                        "name": file_name,
                        "url": file_url if file_url.startswith("http") else "https://cse.knu.ac.kr" + file_url
                    })

        return {
            "content": content,
            "attachments": attachments
        }

    except requests.exceptions.RequestException as e:
        print(f"[오류] 상세 페이지 요청 실패 ({url}): {e}")
        return None


def get_knu_notice_list(page=1):
    """경북대학교 본부 공지사항 목록 한 페이지 크롤링."""
    params = {**KNU_PARAMS, "pageIndex": page}
    try:
        res = session.get(
            KNU_BOARD_URL,
            params=params,
            headers={"Referer": KNU_BASE_URL},
            timeout=10,
        )
        res.raise_for_status()
        return res.text
    except requests.exceptions.RequestException as e:
        print(f"[오류] KNU 목록 페이지 {page} 요청 실패: {e}")
        return None


def parse_knu_notice_list(html):
    """경북대학교 본부 공지 목록에서 게시글 링크와 제목 추출."""
    soup = BeautifulSoup(html, "html.parser")
    notices = []

    for row in soup.select("table tbody tr"):
        link = row.select_one("td.subject a[onclick*='doRead']")
        if not link:
            continue

        onclick = link.get("onclick", "")
        match = re.search(
            r"doRead\('([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\)",
            onclick,
        )
        if not match:
            continue

        doc_no, appl_no, bbs_cde, note_div = match.groups()
        title = link.get_text(" ", strip=True)
        url = urljoin(KNU_BOARD_URL, "viewBtin.action")
        query = (
            f"?btin.bbs_cde={bbs_cde}&btin.doc_no={doc_no}&btin.appl_no={appl_no}"
            f"&btin.page=1&btin.search_type=&btin.search_text=&popupDeco="
            f"&btin.note_div={note_div}&menu_idx=67"
        )

        num_td = row.select_one("td.num")
        date_td = row.select_one("td.date")
        writer_td = row.select_one("td.writer")

        notices.append({
            "num": num_td.get_text(strip=True) if num_td else "",
            "wr_id": f"knu:{doc_no}",
            "source": "knu",
            "doc_no": doc_no,
            "appl_no": appl_no,
            "bbs_cde": bbs_cde,
            "note_div": note_div,
            "writer": writer_td.get_text(strip=True) if writer_td else "",
            "title": title,
            "url": url + query,
            "date": date_td.get_text(strip=True).replace("/", "-") if date_td else "",
        })

    return notices


def get_knu_notice_detail(notice):
    """경북대학교 본부 게시글 상세 내용 + 첨부파일 URL 수집."""
    try:
        res = session.get(
            notice["url"],
            headers={"Referer": KNU_BOARD_URL},
            timeout=10,
        )
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")

        content_tag = soup.select_one(".board_cont")
        content = content_tag.get_text(separator="\n", strip=True) if content_tag else ""

        attachments = []
        for a_tag in soup.select(".attach a[href*='doDownload']"):
            href = a_tag.get("href", "")
            match = re.search(
                r"doDownload\('([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\)",
                href,
            )
            if not match:
                continue

            doc_no, appl_no, file_nbr = match.groups()
            file_name = a_tag.get_text(strip=True)
            file_url = (
                f"{KNU_BASE_URL}/wbbs/wbbs/bbs/btin/download.action"
                f"?appFile.bbs_cde=1&appFile.doc_no={doc_no}"
                f"&appFile.appl_no={appl_no}&appFile.file_nbr={file_nbr}"
                f"&btin.bbs_cde=1&btin.doc_no={doc_no}&btin.appl_no={appl_no}"
            )
            attachments.append({"name": file_name, "url": file_url})

        return {
            "content": content,
            "attachments": attachments,
        }

    except requests.exceptions.RequestException as e:
        print(f"[오류] KNU 상세 페이지 요청 실패 ({notice.get('url')}): {e}")
        return None


NOTICE_SOURCES = [
    {
        "name": "cse",
        "list": get_cse_notice_list,
        "parse": parse_cse_notice_list,
        "detail": lambda notice: get_cse_notice_detail(notice["url"]),
    },
    {
        "name": "knu",
        "list": get_knu_notice_list,
        "parse": parse_knu_notice_list,
        "detail": get_knu_notice_detail,
    },
]


# Backward-compatible names for ad-hoc scripts that imported the old crawler API.
get_notice_list = get_cse_notice_list
parse_notice_list = parse_cse_notice_list
get_notice_detail = get_cse_notice_detail


def crawl(max_pages=3):
    """Crawl list pages and merge them into the existing notices.json."""
    all_notices = []
    existing_notices = load_existing_notices()
    existing_by_id = {notice_id(n): n for n in existing_notices if notice_id(n)}

    print(f"[start] crawl notices (max_pages={max_pages})")
    if existing_by_id:
        print(f"[existing] loaded {len(existing_by_id)} notices")

    for source in NOTICE_SOURCES:
        print(f"\n[source] {source['name']}")
        for page in range(1, max_pages + 1):
            print(f"\n[{source['name']} page {page}] collect list")
            html = source["list"](page)

            if html is None:
                print("[stop] request failed")
                break

            notices = source["parse"](html)

            if not notices:
                print(f"[{source['name']} page {page}] parse failed")
                with open(f"debug_{source['name']}_page{page}.html", "w", encoding="utf-8") as f:
                    f.write(html)
                print(f"  debug_{source['name']}_page{page}.html saved")
                break

            print(f"[{source['name']} page {page}] found {len(notices)} notices")

            for i, notice in enumerate(notices):
                key = notice_id(notice)
                if key in existing_by_id:
                    print(f"  [{i+1}/{len(notices)}] cached: {notice['title'][:40]}")
                    notice = {**existing_by_id[key], **notice}
                else:
                    print(f"  [{i+1}/{len(notices)}] new: {notice['title'][:40]}")
                    detail = source["detail"](notice)
                    if detail:
                        notice.update(detail)
                all_notices.append(notice)
                time.sleep(0.5)

    if all_notices:
        merged_notices = merge_notices(all_notices, existing_notices)
        with open(NOTICES_PATH, "w", encoding="utf-8") as f:
            json.dump(merged_notices, f, ensure_ascii=False, indent=2)
        new_count = sum(1 for n in all_notices if notice_id(n) not in existing_by_id)
        print(
            f"\n[done] crawled={len(all_notices)} new={new_count} "
            f"total={len(merged_notices)} saved={NOTICES_PATH}"
        )
        return merged_notices

    return existing_notices

def download_attachments(notices):
    """수집된 공지사항의 첨부파일 전체 다운로드"""
    total = sum(len(n.get("attachments", [])) for n in notices)
    print(f"\n[다운로드 시작] 총 {total}개 첨부파일")

    downloaded = 0
    failed = 0
    skipped = 0

    SUPPORTED_EXT = {".pdf", ".hwp", ".hwpx", ".xlsx", ".xls", ".docx", ".zip"}

    for notice in notices:
        attachments = notice.get("attachments", [])
        if not attachments:
            continue

        # 공지별 폴더 생성 (source-aware notice_id 기준)
        wr_id = safe_notice_dir(notice)

        save_dir = os.path.join(ATTACHMENT_DIR, wr_id)
        os.makedirs(save_dir, exist_ok=True)

        # 다운로드 전에 게시글 상세 페이지를 한 번 방문해서 세션 쿠키 확보
        notice_url = notice["url"]
        try:
            session.get(notice_url, timeout=10)
        except requests.exceptions.RequestException:
            pass  # 실패해도 다운로드는 시도

        for att in attachments:
            file_name = att["name"]
            file_url = att["url"]

            ext = os.path.splitext(file_name)[1].lower()
            if ext not in SUPPORTED_EXT:
                print(f"  [스킵] 지원하지 않는 형식: {file_name}")
                skipped += 1
                continue

            save_path = os.path.join(save_dir, file_name)

            if os.path.exists(save_path):
                print(f"  [스킵] 이미 존재: {file_name}")
                skipped += 1
                continue

            try:
                # Referer를 해당 게시글 상세 URL로 지정해야 다운로드 허용됨
                res = session.get(
                    file_url,
                    headers={"Referer": notice_url},
                    timeout=30
                )
                res.raise_for_status()

                # 응답이 실제 파일이 아닌 HTML(오류 페이지)인지 검증
                content_type = res.headers.get("Content-Type", "").lower()
                head = res.content[:512].lstrip().lower()
                is_html = (
                    "text/html" in content_type
                    or head.startswith(b"<!doctype html")
                    or head.startswith(b"<html")
                )
                if is_html:
                    print(f"  [실패] HTML 응답 (다운로드 거부됨): {file_name}")
                    failed += 1
                    continue

                with open(save_path, "wb") as f:
                    f.write(res.content)

                size_kb = len(res.content) / 1024
                print(f"  [완료] {file_name} ({size_kb:.1f}KB)")
                downloaded += 1
                time.sleep(0.3)

            except Exception as e:
                print(f"  [실패] {file_name}: {e}")
                failed += 1

    print(f"\n[다운로드 완료] 성공: {downloaded}개 / 스킵: {skipped}개 / 실패: {failed}개")
    print(f"저장 위치: {ATTACHMENT_DIR}")


if __name__ == "__main__":
    # 1. 크롤링 (기존 notices.json 이 있으면 새 공지와 병합)
    notices = crawl(max_pages=3)

    # 2. 첨부파일 다운로드
    download_attachments(notices)

