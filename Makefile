BACKEND_DIR := ../kingfisher-backend/backend
FRONTEND_DIR := ../kingfisher-frontend/frontend

.PHONY: dev dev-remote stop seed migrate test-backend db-shell

## Start Postgres + backend + frontend together (Ctrl+C to stop backend/frontend)
dev:
	./start.sh

## Start backend + frontend against the remote (Supabase) DB — no local Postgres
dev-remote:
	./start-remote.sh

## Kill anything listening on the backend/frontend dev ports
stop:
	-lsof -ti :8000 -sTCP:LISTEN | xargs kill 2>/dev/null
	-lsof -ti :5173 -sTCP:LISTEN | xargs kill 2>/dev/null

## Seed the database with the curated problem set + "NeetCode 150" list
seed:
	cd $(BACKEND_DIR) && venv/bin/python -m scripts.seed

## Apply pending Alembic migrations
migrate:
	cd $(BACKEND_DIR) && venv/bin/alembic upgrade head

## Run the backend pytest suite
test-backend:
	cd $(BACKEND_DIR) && venv/bin/python -m pytest tests/ -q

## Open a psql shell into the running Postgres container
db-shell:
	docker exec -it $$(cd $(BACKEND_DIR) && docker compose ps -q db) psql -U postgres -d kingfisher
