"""GET /api/history, GET /api/history/:sessionId, DELETE /api/history/:sessionId."""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session as DBSession

from ..db.database import get_db
from ..services import session as session_svc


router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("")
def list_sessions(db: DBSession = Depends(get_db)):
    return {"sessions": session_svc.list_sessions(db)}


@router.get("/{session_id}")
def get_session(session_id: str, db: DBSession = Depends(get_db)):
    msgs = session_svc.get_session_messages(db, session_id)
    if msgs is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"sessionId": session_id, "messages": msgs}


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: str, db: DBSession = Depends(get_db)):
    ok = session_svc.delete_session(db, session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return None
