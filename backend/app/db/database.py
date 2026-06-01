import os
from sqlalchemy import inspect, text
from sqlmodel import SQLModel, create_engine, Session as DBSession

from ..config import DB_URL, DB_PATH

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# SQLite needs check_same_thread=False for FastAPI's threaded request handling
engine = create_engine(
    DB_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    _ensure_message_columns()


def _ensure_message_columns() -> None:
    """Add lightweight SQLite columns when an older local app.db already exists."""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "message" not in table_names:
        return

    existing = {column["name"] for column in inspector.get_columns("message")}
    columns = {
        "graph_json": "TEXT",
        "followups_json": "TEXT",
    }
    missing = [(name, ddl_type) for name, ddl_type in columns.items() if name not in existing]
    if not missing:
        return

    with engine.begin() as conn:
        for name, ddl_type in missing:
            conn.execute(text(f"ALTER TABLE message ADD COLUMN {name} {ddl_type}"))


def get_db():
    with DBSession(engine) as session:
        yield session
