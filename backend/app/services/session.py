"""세션/메시지 CRUD."""
import json
import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import select, Session as DBSession

from ..db.models import Session, Message


def _new_id() -> str:
    return uuid.uuid4().hex


def get_or_create_session(db: DBSession, session_id: Optional[str], first_user_message: str) -> Session:
    if session_id:
        sess = db.get(Session, session_id)
        if sess:
            return sess
    # 새 세션 — 첫 user 메시지 앞부분으로 title 자동 생성
    title = (first_user_message or "").strip().replace("\n", " ")[:30] or "새 대화"
    sess = Session(id=_new_id(), title=title)
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return sess


def add_message(
    db: DBSession,
    session_id: str,
    role: str,
    content: str,
    sources: Optional[list[dict]] = None,
    graph_data: Optional[dict] = None,
    followups: Optional[list[str]] = None,
    is_error: bool = False,
) -> Message:
    msg = Message(
        id=_new_id(),
        session_id=session_id,
        role=role,
        content=content,
        sources_json=json.dumps(sources, ensure_ascii=False) if sources else None,
        graph_json=json.dumps(graph_data, ensure_ascii=False) if graph_data else None,
        followups_json=json.dumps(followups, ensure_ascii=False) if followups else None,
        is_error=is_error,
    )
    db.add(msg)
    # 세션의 updated_at 갱신
    sess = db.get(Session, session_id)
    if sess:
        sess.updated_at = datetime.utcnow()
        db.add(sess)
    db.commit()
    db.refresh(msg)
    return msg


def list_sessions(db: DBSession) -> list[dict]:
    sessions = db.exec(select(Session).order_by(Session.updated_at.desc())).all()
    out = []
    for s in sessions:
        # message count — 세션마다 count() 쿼리
        cnt = len(db.exec(select(Message.id).where(Message.session_id == s.id)).all())
        out.append({
            "id": s.id,
            "title": s.title,
            "createdAt": s.created_at.isoformat(),
            "updatedAt": s.updated_at.isoformat(),
            "messageCount": cnt,
        })
    return out


def get_session_messages(db: DBSession, session_id: str) -> Optional[list[dict]]:
    sess = db.get(Session, session_id)
    if not sess:
        return None
    msgs = db.exec(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at)
    ).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "sources": json.loads(m.sources_json) if m.sources_json else None,
            "graphData": json.loads(m.graph_json) if m.graph_json else None,
            "followups": json.loads(m.followups_json) if m.followups_json else None,
            "createdAt": m.created_at.isoformat(),
            "isError": m.is_error,
        }
        for m in msgs
    ]


def delete_session(db: DBSession, session_id: str) -> bool:
    sess = db.get(Session, session_id)
    if not sess:
        return False
    # 메시지 먼저 삭제 (foreign key)
    msgs = db.exec(select(Message).where(Message.session_id == session_id)).all()
    for m in msgs:
        db.delete(m)
    db.delete(sess)
    db.commit()
    return True
