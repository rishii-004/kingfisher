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


FROM python:3.12-slim

RUN useradd --create-home --shell /usr/sbin/nologin app

WORKDIR /app

# Installed directly (not COPY --from=caddy:2-alpine) — copying the official
# image's binary across build stages loses/corrupts its cap_net_bind_service
# file capability, which some container runtimes (e.g. Render's) refuse to
# exec ("Operation not permitted"). We don't need that capability anyway
# since Caddy only ever binds to $PORT (>1024), so just fetch the plain
# release binary.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=amd64" -o /usr/local/bin/caddy \
    && chmod +x /usr/local/bin/caddy \
    && apt-get purge -y curl \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

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
