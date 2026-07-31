# kingfisher — Production Readiness Plan

> Scoped for the actual deployment target: a handful of users, single
> small server (or a couple of small containers), not a scaled SaaS.
> No rate limiting, no horizontal scaling, no K8s, no CDN, no read
> replicas — that's deliberate over-engineering for this app's size,
> not an oversight. Revisit if usage actually grows.

Status of each item is tracked with checkboxes below and updated as
work lands. See `AGENTS.md` → Current Status for the broader project
state.

**Status: all planned items done and verified** (built/ran every
Docker image, ran the full 4-container prod stack end-to-end,
registered a real user through it, measured the bundle-size fix).
What's still explicitly out of scope is listed at the bottom.

---

## 1. Security hardening (backend)

- [x] `SECRET_KEY` refuses to start when `ENVIRONMENT=production` and
      it's still `"change-me-in-production"` (`app/config.py`,
      `model_validator`). Verified: `docker run` with the default
      secret exits immediately with a clear error, before the app
      ever binds a port.
- [x] `CORS_ORIGINS` is now a plain comma-separated env var (was a
      JSON-array string) so the deployed frontend origin can be added
      without fighting JSON quoting in `.env`.
- [x] Added `ENVIRONMENT` (`development` / `production`), used for the
      check above. Decided *not* to gate `/docs`/`/redoc` behind it —
      this is an internal tool for a handful of trusted users, not a
      public API, so the extra toggle wasn't worth the friction; left
      as a one-line note here in case that changes later.
- [x] `.env` confirmed gitignored in both worktrees; added a root
      `.gitignore` for `kingfisher/` (didn't exist before) plus
      `.env.production.example` for the docker-compose deployment path.

**Explicitly not doing:** rate limiting (`RATE_LIMITED` stays
documented-but-unimplemented in `docs/API.md` — fine at this scale),
WAF/DDoS protection, secrets-manager integration (a `.env` file on the
server is adequate for a handful of users).

---

## 2. Containerization

- [x] `kingfisher-backend/backend/Dockerfile` — multi-stage, non-root
      user, entrypoint runs `alembic upgrade head` then starts
      `uvicorn` with 2 workers (no `--reload`). Also pinned
      `requirements.txt` to exact tested versions (was unpinned).
- [x] `kingfisher-frontend/frontend/Dockerfile` — multi-stage: `npm
      run build`, serve `dist/` via Caddy with a `try_files` fallback
      to `index.html` for client-side routes.
- [x] Root `docker-compose.prod.yml` wiring together `db`, `backend`,
      `frontend`, and an `edge` Caddy reverse-proxying `/api/*` to the
      backend and everything else to the frontend, on ports 80/443.
      `POSTGRES_PASSWORD`/`SECRET_KEY` are required env vars (compose
      refuses to start without them, same principle as the backend's
      own `SECRET_KEY` guard).
- [x] All services run with `restart: unless-stopped`.

Verified end-to-end: built all images, ran the full 4-container stack,
registered a real user through `https://localhost` (Caddy's local
self-signed cert — a real `DOMAIN` gets a real Let's Encrypt cert with
no config change), confirmed the SPA's client-side routing survives a
direct hit through the proxy, then tore it down cleanly.

---

## 3. Operational basics

- [x] First-admin bootstrap (`app/bootstrap.py`, run from a FastAPI
      `lifespan` hook): if `INITIAL_ADMIN_EMAIL` is set and that user
      exists, ensure `is_admin = true`. No-op if unset; logs (doesn't
      crash) if the email doesn't match a registered user yet.
- [x] `scripts/backup.sh` runs `pg_dump` *inside* the running Postgres
      container (auto-detects dev's `backend-db-1` or prod's
      `kingfisher-db-1`) rather than requiring a host `pg_dump`
      install — verified against the live dev container. Documented
      in `docs/DATABASE.md` along with the restore command. No
      automated schedule; run manually or add your own cron entry.
- [x] CI: `.github/workflows/backend-ci.yml` (Postgres service
      container, pytest, Docker build) and `frontend-ci.yml` (oxlint,
      `tsc -b && vite build`, Docker build), one per branch — matches
      the README's originally-stated GitHub Actions plan, which had
      never actually been implemented.

---

## 4. Frontend bundle size

Current state: one ~670KB JS chunk (~208KB gzipped), Vite warns about
it. Diagnosis before prescribing a fix:

- `@nivo/heatmap` and `@nivo/radar` are listed in `package.json` but
  **not imported anywhere** in the current code (the heatmap/radar
  widgets were hand-rolled as inline SVG instead). They cost nothing
  in the bundle today (unused imports tree-shake out), but they're
  dead weight in `node_modules`/install time and a future landmine if
  someone imports them without knowing they're this heavy (Nivo pulls
  in d3, which is large).
- The real contributors are: no route-level code splitting (every
  page — including Analytics, the heaviest one — loads on first
  paint regardless of which page you land on), plus framer-motion
  and the app's own code.

**At this scale, is it actually a problem?** Not urgently — 208KB
gzipped on a modern connection loads in well under a second, and
there's no SEO/first-paint-on-3G requirement for an internal tool.
But it's a cheap fix with no real downside, so:

- [x] Removed the unused `@nivo/heatmap`/`@nivo/radar` dependencies.
- [x] Route-level code splitting via `React.lazy`/`Suspense` in
      `App.tsx`.

**Result** (measured with a clean `npm run build`): the single
~670KB/208KB-gzip chunk is now split per-route — `Login` 2.2KB,
`Admin` 11KB, `Lists` 16KB, `Analytics` 24KB (gzipped-ish gzip sizes
Vite reports), each loaded only when that page is actually visited.
The remaining shared/vendor chunks (~276KB, ~186KB, ~124KB
uncompressed) are React/router/query/axios core, loaded once
regardless of route — legitimate shared framework code, not something
route-splitting can shrink further.

**If this still isn't enough later:** `vite-plugin-visualizer` to see
exactly what's in those shared chunks, then manual chunking
(`build.rollupOptions.output.manualChunks`) to split vendor libraries
apart for better browser caching across deploys. Not done now — this
was the "measure after the cheap fix" checkpoint the original plan
called for, and at a few hundred KB gzipped for an internal tool with
a handful of users, it's not worth the added build complexity yet.

---

## Explicitly out of scope for this pass

- Rate limiting (per instruction — handful of users)
- Horizontal scaling / load balancing / multiple app instances
- Managed database (RDS/Cloud SQL) — a single Postgres container with
  a volume and manual backups is fine at this scale
- Structured/centralized logging (stdout + `docker logs` is enough for
  a handful of users; revisit if this becomes a team tool)
- CDN / static asset offloading
- Automated deploy pipeline (CD) — CI (tests/build) only for now
