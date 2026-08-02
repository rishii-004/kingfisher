#!/usr/bin/env bash
# Runs pending migrations, then starts the backend (internal-only) and Caddy
# (public, proxying /api/* to the backend) side by side. Exits — so
# Docker/Render restarts the container — if either process dies, instead of
# silently limping along with only one of the two up.
set -e

cd /app/backend
echo "Running database migrations..."
alembic upgrade head

echo "Starting backend..."
uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2 &
BACKEND_PID=$!

cd /app
echo "Starting Caddy..."
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
CADDY_PID=$!

trap 'kill $BACKEND_PID $CADDY_PID 2>/dev/null' TERM INT

wait -n "$BACKEND_PID" "$CADDY_PID"
EXIT_CODE=$?
kill $BACKEND_PID $CADDY_PID 2>/dev/null
exit $EXIT_CODE
