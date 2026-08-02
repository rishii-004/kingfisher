FROM python:3.12-slim AS builder

WORKDIR /app

RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


FROM python:3.12-slim

RUN useradd --create-home --shell /usr/sbin/nologin app

WORKDIR /app
COPY --from=builder /venv /venv
ENV PATH="/venv/bin:$PATH"

# Render injects PORT (default 10000) and routes traffic to it, so the
# server MUST listen on that value. Locally / under docker-compose PORT
# isn't set, so it falls back to 8000. Overridden at runtime by any
# real PORT env var (e.g. Render's).
ENV PORT=8000

COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app
COPY scripts ./scripts
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh && chown -R app:app /app

USER app

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD python -c "import os,urllib.request; urllib.request.urlopen('http://localhost:%s/api/v1/health' % os.getenv('PORT', '8000'))" || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
# Shell form (not exec) so ${PORT} is expanded at container start — Render
# injects PORT=10000; local/compose deployments fall back to 8000.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
