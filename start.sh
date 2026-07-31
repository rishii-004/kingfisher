#!/usr/bin/env bash
# Starts the full kingfisher stack: Postgres (docker), backend (FastAPI), frontend (Vite).
# Expects the sibling worktrees described in AGENTS.md: ../kingfisher-backend, ../kingfisher-frontend.
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT/../kingfisher-backend/backend"
FRONTEND_DIR="$ROOT/../kingfisher-frontend/frontend"

BACKEND_PORT=8000
FRONTEND_PORT=5173

if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
  echo "ERROR: expected sibling worktrees at ../kingfisher-backend and ../kingfisher-frontend (see AGENTS.md)." >&2
  exit 1
fi

if lsof -i :$BACKEND_PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "ERROR: port $BACKEND_PORT already in use (backend)." >&2
  exit 1
fi
if lsof -i :$FRONTEND_PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "ERROR: port $FRONTEND_PORT already in use (frontend)." >&2
  exit 1
fi

echo "Starting Postgres (docker compose)..."
(cd "$BACKEND_DIR" && docker compose up -d db)

echo "Waiting for Postgres to accept connections..."
DB_CID="$(cd "$BACKEND_DIR" && docker compose ps -q db)"
until docker exec "$DB_CID" pg_isready -U postgres >/dev/null 2>&1; do
  sleep 1
done

if [ ! -d "$BACKEND_DIR/venv" ]; then
  echo "Creating backend virtualenv..."
  (cd "$BACKEND_DIR" && python3 -m venv venv && venv/bin/pip install -q -r requirements.txt)
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "No backend/.env found, copying .env.example..."
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi

echo "Running migrations..."
(cd "$BACKEND_DIR" && venv/bin/alembic upgrade head)

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
fi

echo "Starting backend..."
(cd "$BACKEND_DIR" && exec venv/bin/uvicorn app.main:app --reload --port "$BACKEND_PORT") &
BACKEND_PID=$!

echo "Starting frontend..."
(cd "$FRONTEND_DIR" && exec npx vite --port "$FRONTEND_PORT" --strictPort) &
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "Stopping backend + frontend (Postgres container keeps running — 'docker compose stop db' to stop it)..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Backend:  http://localhost:$BACKEND_PORT/api/v1/health"
echo "  Postgres: localhost:5433 (db: kingfisher, user/pass: postgres/postgres)"
echo "  Press Ctrl+C to stop backend + frontend"
echo ""

wait
