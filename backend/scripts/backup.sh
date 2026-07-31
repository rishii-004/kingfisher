#!/usr/bin/env bash
# Dumps the Postgres database to a timestamped, gzipped SQL file by
# running pg_dump inside the running Postgres container — no local
# postgres-client install required, and it can't drift from whatever
# server version is actually running.
#
# Usage:
#   ./scripts/backup.sh [output-dir]      # defaults to ./backups
#
# Works against either the local dev db (backend/docker-compose.yml,
# container name backend-db-1) or the production stack
# (kingfisher/docker-compose.prod.yml, container name kingfisher-db-1)
# — whichever is running is used; set CONTAINER to override.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-$SCRIPT_DIR/backups}"
mkdir -p "$OUT_DIR"

CONTAINER="${CONTAINER:-}"
if [ -z "$CONTAINER" ]; then
  for candidate in backend-db-1 kingfisher-db-1; do
    if docker ps --format '{{.Names}}' | grep -qx "$candidate"; then
      CONTAINER="$candidate"
      break
    fi
  done
fi

if [ -z "$CONTAINER" ]; then
  echo "ERROR: no running Postgres container found (checked backend-db-1, kingfisher-db-1)." >&2
  echo "       Start it first, or set CONTAINER=<name> explicitly." >&2
  exit 1
fi

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$OUT_DIR/kingfisher-$TIMESTAMP.sql.gz"

echo "Backing up '$CONTAINER' -> $OUT_FILE"
docker exec "$CONTAINER" pg_dump -U postgres kingfisher | gzip > "$OUT_FILE"
echo "Done: $(du -h "$OUT_FILE" | cut -f1)"
