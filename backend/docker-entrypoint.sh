#!/usr/bin/env sh
# Runs pending migrations before starting the app — every container
# start is a safe place to do this since Alembic migrations are
# idempotent (upgrade head is a no-op if already current).
set -e

echo "Running database migrations..."
alembic upgrade head

exec "$@"
