from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Session(SQLModel, table=True):
    id: str = Field(primary_key=True)
    title: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Message(SQLModel, table=True):
    id: str = Field(primary_key=True)
    session_id: str = Field(foreign_key="session.id", index=True)
    role: str  # "user" | "assistant"
    content: str
    # sources stored as JSON string (sqlite has no native JSON column with sqlmodel default)
    sources_json: Optional[str] = None
    graph_json: Optional[str] = None
    followups_json: Optional[str] = None
    is_error: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
