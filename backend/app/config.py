import os
from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
ENV_PATH = os.path.join(PROJECT_ROOT, ".env")

load_dotenv(ENV_PATH)

DB_PATH = os.path.join(PROJECT_ROOT, "data", "app.db")
DB_URL = f"sqlite:///{DB_PATH}"

NOTICES_JSON_PATH = os.path.join(PROJECT_ROOT, "data", "raw", "notices.json")
HYBRID_RAG_PATH = os.path.join(PROJECT_ROOT, "pipeline", "04_hybrid_rag.py")

CORS_ORIGINS = [
    o.strip() for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173",
    ).split(",")
    if o.strip()
]
