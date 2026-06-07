# Home Server Deployment

This deployment runs three containers:

- `rag-frontend`: Nginx serving the built React app and proxying `/api` to the backend
- `rag-backend`: FastAPI, SQLite chat history, ChromaDB access, RAG pipeline imports
- `rag-neo4j`: Neo4j graph database

ChromaDB and app data are bind-mounted from the project directory, so rebuilds do not wipe them.

## 1. Prepare The Server

Install Docker Engine and the Docker Compose plugin.

Clone or copy the project to the home server:

```bash
git clone <repo-url> CapstoneDesign_6
cd CapstoneDesign_6
```

Create the runtime env file:

```bash
cp .env.example .env
nano .env
```

Set real API keys and change `NEO4J_PASSWORD`. Set `CORS_ORIGINS` to include your server URL or IP, for example:

```env
CORS_ORIGINS=http://192.168.0.10,http://localhost,http://127.0.0.1
```

## 2. Copy Existing Data

For a working RAG service, the server needs the same generated stores:

```text
data/
chroma_db/
```

If these are already in the project directory on the server, nothing else is needed.

If you are moving from a dev machine, copy them to the server project root:

```bash
rsync -av data/ user@server:/path/to/CapstoneDesign_6/data/
rsync -av chroma_db/ user@server:/path/to/CapstoneDesign_6/chroma_db/
```

Neo4j data lives in the Docker volume `neo4j_data`. If you need to rebuild it on the server:

```bash
docker compose -f docker-compose.prod.yml run --rm backend python pipeline/03_graph_db.py --rebuild
```

## 3. Start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Open:

```text
http://<home-server-ip>/
```

Useful checks:

```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost/health
curl http://localhost/api/crawl/status
```

Logs:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f neo4j
```

## 4. Update

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 5. Rebuild Search Stores

Run these only when source documents changed and you want the search index refreshed.
The vector and graph commands are incremental by default. Add `--rebuild` to
`03_graph_db.py` only when you intentionally want to clear and rebuild Neo4j.

```bash
docker compose -f docker-compose.prod.yml run --rm backend python pipeline/01_parser.py
docker compose -f docker-compose.prod.yml run --rm backend python pipeline/02_vector_db.py
docker compose -f docker-compose.prod.yml run --rm backend python pipeline/03_graph_db.py
```

The Settings page sync button runs the full pipeline: crawl, download, parse,
incremental vector update, incremental graph update, and RAG cache reload.
The crawl range is the latest N notice-list pages. The UI defaults to 3 pages,
and the server caps the accepted value with `MAX_SYNC_PAGES`.

Manual/evaluation documents are excluded from the web index by default. Set
`INCLUDE_MANUAL_FILES=true` only when running local evaluation experiments.

The Settings page sync action is admin-only. Set `SYNC_ADMIN_TOKEN` in the
server `.env`, then enter the same token in the Settings page before clicking
sync.

## 6. Port Notes

Defaults:

- Frontend: `80`
- Backend: `8000`
- Neo4j browser: `7474`
- Neo4j bolt: `7687`

Change these in `.env`:

```env
FRONTEND_PORT=8080
BACKEND_PORT=8000
NEO4J_HTTP_PORT=7474
NEO4J_BOLT_PORT=7687
```

If exposing this outside your LAN, put it behind HTTPS with a reverse proxy such as Caddy, Nginx Proxy Manager, or Traefik.
