"""FastAPI 진입점."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .db.database import init_db
from .routers import chat, history, meta, crawl, stats


app = FastAPI(title="Lucid RAG Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(history.router)
app.include_router(meta.router)
app.include_router(crawl.router)
app.include_router(stats.router)


@app.on_event("startup")
def _startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}
