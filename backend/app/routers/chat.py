"""POST /api/chat — 챗봇 응답.

프론트의 chat.api.ts 는 SSE (data: <json>\\n) 스트림을 기대한다.
MVP 는 한방에 RAG 끝낸 뒤 청크 4개를 순서대로 한 번에 emit:
  session → sources → text → done
"""
import json
from typing import Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import Session as DBSession

from ..db.database import engine
from ..services import rag, session as session_svc


router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    sessionId: Optional[str] = None
    message: str


def _sse(obj: dict) -> str:
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


@router.post("/chat")
async def chat(req: ChatRequest):
    # 세션/유저 메시지 저장은 endpoint 함수 내에서 짧은 트랜잭션으로 끝낸다.
    # 그 다음 stream() 안에선 필요할 때 새 DB 세션을 열어 쓴다.
    # (FastAPI 의 Depends(get_db) 는 endpoint 함수 종료 시점에 세션을 닫아버려
    #  StreamingResponse 의 generator 가 detached 상태가 됨 → 별도 트랜잭션으로 분리.)
    with DBSession(engine) as db:
        sess = session_svc.get_or_create_session(db, req.sessionId, req.message)
        session_id = sess.id
        session_svc.add_message(db, session_id, role="user", content=req.message)

    def stream():
        # 1) session id 먼저 알려서 프론트가 신규 세션 ID 받을 수 있게
        yield _sse({"type": "session", "sessionId": session_id})

        try:
            result = rag.run_hybrid_rag(req.message)
            answer = result["answer"]
            sources = result["sources"]
            knowledge_graph = result.get("knowledge_graph")
            retrieval = result.get("retrieval")

            with DBSession(engine) as db2:
                session_svc.add_message(
                    db2, session_id, role="assistant",
                    content=answer, sources=sources, graph_data=knowledge_graph,
                    retrieval=retrieval,
                )

            # text 를 먼저 보내 프론트가 assistant 버블을 생성하게 한 뒤
            # sources/graph/retrieval 로 메시지 메타를 보강. (프론트 routeChunk 가 첫 'text'에서만 버블 생성)
            yield _sse({"type": "text", "content": answer})
            yield _sse({"type": "sources", "sources": sources})
            if knowledge_graph is not None:
                yield _sse({"type": "graph", "graphData": knowledge_graph})
            if retrieval is not None:
                yield _sse({"type": "retrieval", "retrieval": retrieval})
            yield _sse({"type": "done"})
        except Exception as e:
            err = f"{type(e).__name__}: {e}"
            with DBSession(engine) as db2:
                session_svc.add_message(
                    db2, session_id, role="assistant",
                    content=err, is_error=True,
                )
            yield _sse({"type": "error", "error": err})

    return StreamingResponse(stream(), media_type="text/event-stream")
