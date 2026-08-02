FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build


FROM python:3.12-slim AS backend-builder

WORKDIR /app

RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


FROM caddy:2-alpine AS caddy-bin


FROM python:3.12-slim

RUN useradd --create-home --shell /usr/sbin/nologin app

WORKDIR /app

COPY --from=caddy-bin /usr/bin/caddy /usr/local/bin/caddy
COPY --from=backend-builder /venv /venv
ENV PATH="/venv/bin:$PATH"

COPY backend/alembic.ini ./backend/alembic.ini
COPY backend/alembic ./backend/alembic
COPY backend/app ./backend/app
COPY backend/scripts ./backend/scripts
COPY --from=frontend-builder /app/dist /srv

COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY deploy/entrypoint.sh .
RUN chmod +x entrypoint.sh && chown -R app:app /app /srv

USER app

# Render injects PORT (default 10000) and routes traffic to it; Caddy is the
# public-facing process and binds to it. Uvicorn stays on a fixed internal
# port (127.0.0.1:8000) reachable only from Caddy inside this container.
ENV PORT=8080

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD python -c "import os,urllib.request; urllib.request.urlopen('http://localhost:%s/api/v1/health' % os.getenv('PORT', '8080'))" || exit 1

ENTRYPOINT ["./entrypoint.sh"]
