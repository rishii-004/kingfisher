# kingfisher — Production Readiness Plan

> Scoped for the actual deployment target: a handful of users, single
> small server (or a couple of small containers), not a scaled SaaS.
> No rate limiting, no horizontal scaling, no K8s, no CDN, no read
> replicas — that's deliberate over-engineering for this app's size,
> not an oversight. Revisit if usage actually grows.

Status of each item is tracked with checkboxes below and updated as
work lands. See `AGENTS.md` → Current Status for the broader project
state.

---

## 1. Security hardening (backend)

- [ ] `SECRET_KEY` currently defaults to `"change-me-in-production"` —
      the app must refuse to start with that value unless an explicit
      `ENVIRONMENT=development` flag is set. Forces a real secret in
      prod instead of silently running insecurely.
- [ ] `CORS_ORIGINS` is hardcoded to `http://localhost:5173` — make it
      a comma-separated env var so the deployed frontend origin can be
      added without a code change.
- [ ] Add an `ENVIRONMENT` setting (`development` / `production`) used
      for the checks above and to gate FastAPI's `/docs` and `/redoc`
      (leave them on — this is an internal tool with a handful of
      trusted users, not a public API, so hiding docs isn't worth the
      friction — but make it a one-line toggle in `config.py` in case
      that changes).
- [ ] Confirm `.env` stays gitignored (already true) and ship a
      `.env.production.example` template with placeholders, not real
      values.

**Explicitly not doing:** rate limiting (`RATE_LIMITED` stays
documented-but-unimplemented in `docs/API.md` — fine at this scale),
WAF/DDoS protection, secrets-manager integration (a `.env` file on the
server is adequate for a handful of users).

---

## 2. Containerization

- [ ] `kingfisher-backend/backend/Dockerfile` — multi-stage: install
      deps, copy app, run as non-root user, entrypoint runs
      `alembic upgrade head` then starts `uvicorn` with a couple of
      workers (no `--reload`).
- [ ] `kingfisher-frontend/frontend/Dockerfile` — multi-stage: `npm
      run build`, serve the static `dist/` via Caddy (simpler config
      and free automatic HTTPS vs. nginx+certbot — right tool for a
      small deployment with no dedicated ops person).
- [ ] Root `docker-compose.prod.yml` (in `kingfisher/`, since it spans
      both worktrees) wiring together `db` (already defined in the
      backend worktree), `backend`, `frontend`, with a `Caddyfile`
      reverse-proxying `/api/*` to the backend and everything else to
      the frontend, on a single exposed port (80/443).
- [ ] Both containers run with `restart: unless-stopped` — that's the
      process-supervision story at this scale; no need for a separate
      process manager like gunicorn on top of uvicorn.

---

## 3. Operational basics

- [ ] First-admin bootstrap: on backend startup, if
      `INITIAL_ADMIN_EMAIL` is set and that user exists, ensure
      `is_admin = true`. Closes the "promote your first admin by hand
      in psql" gap without building a full invite/role system.
- [ ] `docs/DATABASE.md` gets a backup section: a `scripts/backup.sh`
      wrapping `pg_dump` to a timestamped file, run manually or via a
      simple cron entry — no managed backup service needed for this
      scale, but "no backup story at all" isn't acceptable for real
      user data.
- [ ] CI: one GitHub Actions workflow per branch (`backend`,
      `frontend`) — `backend` runs `pytest` against a Postgres service
      container, `frontend` runs `tsc -b && vite build`. Catches
      regressions before merge; nothing fancier (no deploy automation)
      needed yet since deploys are manual at this scale.

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

- [ ] Remove the unused `@nivo/heatmap`/`@nivo/radar` dependencies.
- [ ] Route-level code splitting via `React.lazy`/`Suspense` in
      `App.tsx` — each page becomes its own chunk, so logging in only
      loads `Login`, not `Analytics` + `Admin` + everything else.

**If this still isn't enough later:** `vite-plugin-visualizer` to see
exactly what's in the remaining vendor chunk, then manual chunking
(`build.rollupOptions.output.manualChunks`) for anything still large.
Not doing this preemptively — measure after the two steps above
before reaching for it.

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
