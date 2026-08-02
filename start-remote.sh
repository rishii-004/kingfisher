#!/usr/bin/env bash
# Starts backend + frontend against the remote (Supabase) database.
# No local Postgres — uses the DATABASE_URL already in backend/.env.
# Expects sibling worktrees ../kingfisher-backend and ../kingfisher-frontend (see AGENTS.md).
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

if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "ERROR: backend/.env not found — it must contain your remote DATABASE_URL." >&2
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

if [ ! -d "$BACKEND_DIR/venv" ]; then
  echo "Creating backend virtualenv..."
  (cd "$BACKEND_DIR" && python3 -m venv venv && venv/bin/pip install -q -r requirements.txt)
fi

echo "Applying migrations against remote DB..."
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
  echo "Stopping backend + frontend..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Backend:  http://localhost:$BACKEND_PORT/api/v1/health"
echo "  Database: remote (Supabase) — from backend/.env"
echo "  Press Ctrl+C to stop backend + frontend"
echo ""

wait
