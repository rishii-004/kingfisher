# kingfisher — Agent Memory Bank

This file serves as persistent memory for AI agents working on this project.
Read this first before making any changes.

---

## Project Overview

**kingfisher** is a full-stack LeetCode/problem-solving tracker that goes beyond simple tracking. It includes spaced repetition for reviews, detailed post-solve logging, analytics dashboards, custom list management with per-topic drag-to-reorder, and multi-user support with admin roles.

---

## Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.12)
- **ORM:** SQLAlchemy + Pydantic v2 (`pydantic-settings` for config)
- **Database:** PostgreSQL 16
- **Migrations:** Alembic
- **Auth:** python-jose (JWT) + bcrypt
- **Testing:** pytest + FastAPI's `TestClient` (httpx under the hood), run against the real dev Postgres — no separate test database

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Headless UI:** Base UI (`@base-ui/react` — unstyled primitives; note this is *not* the same package as the older `@base-ui-components/react`)
- **Animation / drag-to-reorder:** Framer Motion (`Reorder.Group`/`Reorder.Item` for list reordering, not a separate DnD library)
- **Charts:** hand-rolled inline SVG (heatmap, radar) — `@nivo/heatmap`/`@nivo/radar` were in `package.json` early on but never actually imported; removed as dead weight
- **Routing:** React Router v6, route-level code splitting via `React.lazy`
- **HTTP Client:** React Query + axios (`src/lib/api.ts`, handles auth header injection + refresh-token retry)
- **Auth state:** plain `localStorage`-backed store (`src/stores/auth-store.ts`), not zustand/context — see Gotchas below for how it stays fresh

### Infrastructure
- **Containerization:** Docker (multi-stage builds, non-root users) for both backend and frontend; `docker-compose.yml` (dev, Postgres only) and `docker-compose.prod.yml` (full stack: db + backend + frontend + Caddy edge)
- **Reverse Proxy / TLS:** Caddy (auto-HTTPS via Let's Encrypt for a real domain; self-signed for `localhost`)
- **CI/CD:** GitHub Actions — one workflow per repo/branch (`backend-ci.yml`, `frontend-ci.yml`), Postgres service container for backend tests, no CD (deploy is manual)

---

## Architecture Decisions

1. **Database Forking for Lists** — When a user wants to customize a global list (e.g. NeetCode 150), the backend forks it into a new owned `lists` row (`is_custom=true`, `forked_from_id` pointing at the original) rather than mutating the global one. One fork per user per global list (enforced via a uniqueness check, not a DB constraint).
2. **Post-Solve Popup** — Triggered when a problem's status changes to "solved". Captures notes, mistake tags, and a time-spent bucket, and schedules the first spaced-repetition review.
3. **Spaced Repetition** — Modified Leitner system. First review due 1 week after solving, then intervals expand (7d → 14d → 30d → 90d).
4. **Admin Flag** — `is_admin` boolean on `users` gates admin-only endpoints (`/admin/*`) and bypasses the per-user list quota entirely.
5. **JWT Auth** — Access (15min) + refresh (7d) token pair. The frontend's cached user snapshot (role, quota) is refreshed via `GET /auth/me` on every mount, not just at login — see Gotchas.
6. **No ORM-level cascade deletes** — every FK relationship (`lists.owner_id`, `reviews.solve_log_id`, etc.) is a plain FK with no `ON DELETE CASCADE`. Deletes that need to respect foreign keys are done explicitly, in the correct order, in routers/services. This is a deliberate choice (explicit > implicit for destructive operations) but it's also a real footgun — see Gotchas.
7. **Response envelope** — every endpoint returns `{ "data": ..., "error": { "code", "message" } | null }`. Never a bare array/object, never a raw HTTP error body.
8. **Seed data is generated, not fetched live** — `scripts/seed_data.py` (the actual problem catalog, ~26k lines) is produced once by a one-off data-prep script and committed as static Python, not fetched from LeetCode/GitHub at runtime. `scripts/seed.py` is the small, hand-maintained upsert logic that reads it. Regenerating the catalog is a deliberate, manual, reviewed act — not something that happens automatically.
9. **Per-user list quota** — every user can own at most `max_lists` lists (created + forked), default 30, configurable via `DEFAULT_MAX_LISTS` env var and per-user override via the admin panel. Admins are always unlimited. Exists specifically to stop "create list from filtered results" (a one-click bulk action) from flooding a user with lists.
10. **Time tracking is client-only** — "time today" / "time spent this week" live entirely in `localStorage`, no backend table. See `kingfisher-frontend/docs/TIME_TRACKING.md` for the full rationale (a DB-backed version was built and deliberately reverted the same day).

---

## Directory Structure

```
kingfisher-parent/
├── kingfisher/              # Main repo (main branch) — shared docs, deploy config
│   ├── AGENTS.md            # This file
│   ├── README.md
│   ├── start.sh / Makefile  # Local dev convenience (Postgres + backend + frontend)
│   ├── docker-compose.prod.yml   # Full prod stack: db + backend + frontend + Caddy edge
│   ├── Caddyfile             # Prod reverse-proxy config (used by docker-compose.prod.yml)
│   ├── .env.production.example
│   └── docs/
│       ├── ROADMAP.md        # Original development plan (historical)
│       └── PROD_READINESS.md # Prod-hardening plan + what's explicitly out of scope
│
├── kingfisher-backend/      # Worktree (backend branch)
│   ├── backend/
│   │   ├── app/
│   │   │   ├── main.py       # FastAPI entry point, router mounting, lifespan (admin bootstrap)
│   │   │   ├── config.py     # Settings (pydantic-settings), incl. prod SECRET_KEY guard
│   │   │   ├── bootstrap.py  # Promotes INITIAL_ADMIN_EMAIL to admin on startup
│   │   │   ├── database.py   # Engine + session
│   │   │   ├── models/       # SQLAlchemy models (no relationship() cascades)
│   │   │   ├── schemas/      # Pydantic request/response schemas
│   │   │   ├── routers/      # Route handlers — thin, delegate to services/
│   │   │   ├── services/     # Business logic (list_quota, problem_filters, analytics, ...)
│   │   │   └── utils/        # JWT helpers etc.
│   │   ├── alembic/versions/ # Migrations
│   │   ├── scripts/
│   │   │   ├── seed.py       # Idempotent upsert logic (small, hand-maintained)
│   │   │   ├── seed_data.py  # The actual catalog data (generated, ~26k lines, don't hand-edit)
│   │   │   └── backup.sh     # pg_dump wrapper, auto-detects dev/prod container name
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt  # Pinned exact versions
│   └── docs/
│       ├── API.md            # Full endpoint contract
│       ├── DATABASE.md       # Schema, FK order, seeding, backup/restore, making an admin
│       └── TODOS.md          # Original build log (historical, all done)
│
└── kingfisher-frontend/     # Worktree (frontend branch)
    ├── frontend/
    │   ├── src/
    │   │   ├── components/   # Shared UI (Select, ProblemRow, ...)
    │   │   ├── features/     # Feature-scoped components (solve-log, lists)
    │   │   ├── hooks/        # React Query hooks + a few plain hooks (use-time-spent)
    │   │   ├── lib/          # api client, topics/companies constants, mock.ts (gitignored)
    │   │   ├── pages/        # Route-level pages, lazy-loaded
    │   │   ├── stores/       # auth-store.ts — plain localStorage wrapper, not zustand
    │   │   └── types/        # Shared TS interfaces mirroring backend schemas
    │   ├── Dockerfile
    │   └── package.json
    └── docs/
        ├── API.md
        ├── ROADMAP.md
        └── TIME_TRACKING.md   # Why time tracking is client-only — read before touching it
```

---

## Conventions

### Code Style
- **Python:** PEP 8-ish, type hints throughout, no linter/formatter currently enforced in CI beyond what the tests catch.
- **TypeScript:** strict mode, functional components, hooks over classes. `oxlint` runs in frontend CI.
- **Imports:** stdlib/external first, then internal, blank line between.
- **Naming:** `snake_case` (Python), `camelCase` (TS runtime), `PascalCase` (components, Pydantic/SQLAlchemy classes).

### Git
- Commits: conventional-ish (`feat(scope): ...`, `fix(scope): ...`, `docs: ...`, `chore: ...`, `revert: ...`) with a body explaining *why*, not just what.
- Commit **incrementally** — one logical change per commit, not one giant commit at the end of a session.
- Branches: `main` (shared docs/deploy config), `backend`, `frontend` — see worktree section below. No `dev`/`feat/*` branches in practice; work happens directly on `backend`/`frontend`.

### API
- RESTful endpoints at `/api/v1/...`.
- Every response is the envelope: `{ "data": ..., "error": { "code", "message" } | null }`.
- Pagination: `?page=1&per_page=20` → `{ "items": [], "total": N, "page": N, "per_page": N }`.
- Status-code → error-code mapping is centralized in `app/main.py`'s exception handler (`_STATUS_CODES`), not per-endpoint.

---

## Git Workflow with Worktrees

This project uses **git worktrees** — one shared `.git`, three working directories, each checked out on a different branch. A commit made in any one of them updates the shared refs, so `git push` for a given branch works from any of the three directories (not just its "own").

```
kingfisher/            branch: main       — shared docs, deploy config
kingfisher-backend/    branch: backend    — backend source
kingfisher-frontend/   branch: frontend   — frontend source
```

### Daily workflow

```bash
# Backend work
cd kingfisher-backend && git add -A && git commit -m "feat(backend): ..." && git push origin backend

# Frontend work
cd kingfisher-frontend && git add -A && git commit -m "feat(frontend): ..." && git push origin frontend

# Shared docs / deploy config
cd kingfisher && git add -A && git commit -m "docs: ..." && git push origin main
```

### Agent instructions
- Backend work → `kingfisher-backend/backend/`, branch `backend`.
- Frontend work → `kingfisher-frontend/frontend/`, branch `frontend`.
- Shared docs / `AGENTS.md` / prod compose → `kingfisher/`, branch `main`.
- Run backend commands (`pytest`, `alembic`, `uvicorn`) from the backend worktree; frontend commands (`npm`, `vite`) from the frontend worktree.
- A change that spans both backend and frontend is still **two commits on two branches**, not one — keep them atomic and reviewable independently.

## How to Run

### Local development

```bash
cd kingfisher && ./start.sh      # or: make dev
```

Starts Postgres via Docker, creates/updates the backend venv, runs
migrations, installs frontend deps if needed, and starts
`uvicorn --reload` (port 8000) + `vite` (port 5173). Ctrl+C stops both;
Postgres keeps running (`make stop` or `docker compose ... stop` to
kill it too).

Other `make` targets: `make seed`, `make migrate`, `make test-backend`,
`make db-shell`, `make stop`.

### Manually

```bash
# Postgres
cd kingfisher-backend/backend && docker compose up -d db

# Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed        # loads the full problem catalog (see DATABASE.md)
uvicorn app.main:app --reload

# Frontend
cd kingfisher-frontend/frontend && npm install && npm run dev
```

### Production

```bash
cd kingfisher
cp .env.production.example .env    # fill in POSTGRES_PASSWORD, SECRET_KEY, DOMAIN, etc.
docker compose -f docker-compose.prod.yml up -d --build
```

Builds and runs all four containers (db, backend, frontend, Caddy
edge). See `docs/PROD_READINESS.md` for what's covered, what's
explicitly out of scope (rate limiting, horizontal scaling, managed
DB — all deliberate at this app's current scale), and the reasoning
behind each choice.

---

## Key Documents

| Doc | Location | What it covers |
|---|---|---|
| `docs/ROADMAP.md` | `kingfisher/` | Original 9-phase development plan (historical) |
| `docs/PROD_READINESS.md` | `kingfisher/` | Prod-hardening plan, what's done, what's explicitly deferred and why |
| `docs/API.md` | both `kingfisher-backend/` and `kingfisher-frontend/` | Full endpoint contract — request/response shapes, error codes |
| `docs/DATABASE.md` | `kingfisher-backend/` | Schema, FK deletion order, seeding, backups, making a user admin |
| `docs/TODOS.md` | `kingfisher-backend/` | Original backend build log (historical, all steps done) |
| `docs/TIME_TRACKING.md` | `kingfisher-frontend/` | Why time-spent tracking is client-only, no DB — read before "fixing" it |

## Current Status

Both backend and frontend are feature-complete against the original
roadmap and have since grown well beyond it. Production-readiness
(Docker, CI, security hardening, backups, first-admin bootstrap) is
done — see `docs/PROD_READINESS.md` for the verified checklist and
what's deliberately out of scope at this scale.

- **Problem catalog:** ~3,250 unique LeetCode problems, 440 with
  real company associations (from `liquidslr/leetcode-company-wise-problems`),
  298 of them also in one of two curated global lists (NeetCode 150,
  Striver's A2Z DSA Sheet). See `scripts/seed.py`'s docstring for full
  data provenance.
- **Tests:** 75 pytest tests, run against the live dev Postgres
  (no separate test DB), idempotent — safe to run repeatedly.
- **Lists:** create/fork/delete/reset, drag-to-reorder within a topic
  group (not across topics), "create list from current filters" bulk
  action, per-user quota (default 30, admin-configurable, admin-exempt).
- **Analytics:** heatmap, radar, difficulty breakdown, time-spent
  buckets/trends, weekly pattern, topic/company mastery, mistakes,
  review pipeline, consistency streaks. "Time spent this week" is
  client-only (see Time Tracking above), everything else is backend-computed.
- **Admin:** promote/demote users, delete users, manage the global
  problem catalog and global lists, per-user list-quota override.
  First admin is bootstrapped via `INITIAL_ADMIN_EMAIL` on backend
  startup rather than requiring manual SQL.

---

## Maintenance / Common Tasks

- **Add a curated problem sheet or bulk-import a new problem source:**
  extend `scripts/seed_data.py`'s `PROBLEMS` dict (or regenerate it via
  a one-off data-prep script, as was done for the company-wise data) —
  never fetch from a third party live at runtime. Upsert-by-slug in
  `scripts/seed.py` means re-running the seed after an update is safe.
- **Make someone an admin:** set `INITIAL_ADMIN_EMAIL` in `backend/.env`
  to their email and restart the backend (they must already be
  registered) — see `docs/DATABASE.md`. Avoid raw `UPDATE users SET
  is_admin = true` unless you also update `INITIAL_ADMIN_EMAIL` to
  match, or the bootstrap has nothing to reference on the next restart.
- **Change the default list quota:** `DEFAULT_MAX_LISTS` env var
  (backend). Per-user overrides are separate — admin panel or
  `PATCH /admin/users/{id}/max-lists`.
- **Add a new Alembic migration:** change the model, then
  `alembic revision --autogenerate -m "..."` from `backend/`, then
  **read the generated migration** before applying — autogenerate can
  miss constraints or misfire. Register new models in
  `app/models/__init__.py` or Alembic won't see them.
- **Deleting a user or any row with dependents by hand:** respect FK
  order (see Gotchas) — check `app/routers/admin.py`'s `delete_user`
  for the current authoritative order before copying a pattern.
- **Backups:** `./scripts/backup.sh` (from `backend/`) — `pg_dump`
  inside the running container, no local Postgres client needed. No
  automated schedule; run manually or add a cron entry.
- **Bundle size creeping up:** route-level `React.lazy` is already in
  place per-page; if a shared/vendor chunk grows large, reach for
  `vite-plugin-visualizer` + `manualChunks` before anything more
  drastic (see the "if this still isn't enough" note in
  `docs/PROD_READINESS.md`).

---

## Gotchas & Lessons Learned

Non-obvious traps hit during development — read before you rediscover
them the hard way.

- **FK order on manual deletes.** No table here has `ON DELETE CASCADE`
  (see Architecture Decisions #6). `reviews.solve_log_id` → `solve_logs`,
  so reviews must be deleted before solve logs — getting this backwards
  broke `reset_list_progress` once (fixed, regression-tested). The same
  applies to any new per-user table: check what references it before
  wiring up a delete path, and add a regression test that deletes a row
  *with* dependents present, not just an empty one.
- **pydantic-settings JSON-decodes list/dict-typed env vars before your
  own validators run.** A `field_validator(mode="before")` cannot
  intercept and reformat a non-JSON string for a `list[str]` field —
  the settings source tries `json.loads()` first and raises before your
  validator ever executes. Workaround used here: declare the field as a
  raw `str` (comma-separated) plus a computed `@property` that splits
  it (see `Settings.cors_origins_list`).
- **Base UI's `Select.Positioner` defaults to `alignItemWithTrigger=true`**
  (lining up the selected item's text with the trigger), which assumes
  the popup's items start at a predictable offset from the top. Adding
  a search box inside the popup breaks that assumption and the whole
  popup can render detached, far from the trigger. Fix: set
  `alignItemWithTrigger={false}` for any popup whose internal layout
  isn't just a plain list of items.
- **Racing Base UI's internal focus management.** After opening a
  popup, Base UI moves focus into the listbox itself — a single
  `requestAnimationFrame` attempt to focus a custom element (e.g. a
  search input) can lose that race, and a *cold* first mount can take
  longer to settle than a warm second one, so a fixed retry budget can
  work on the second open but not the first. Fix: retry every frame
  for as long as the popup stays open (tracked via a ref), not a fixed
  attempt count.
- **Vite Fast Refresh doesn't always re-run `useEffect`s with empty
  deps when only the imported hook's module changes** (not the
  component using it) — a `setInterval` set up before the edit can keep
  running with stale closures until a full page reload. If you're
  debugging why a hot-reloaded change to a hook "isn't taking effect,"
  hard-refresh before assuming the code is wrong.
- **The frontend's cached user object was stale by design, not
  accident, until this was fixed.** `useAuth()` used to read the
  user (role, quota) purely from the snapshot cached in `localStorage`
  at login time — an admin promoting someone, or changing their quota,
  never showed up in that browser tab until they logged out and back
  in. Fixed by refetching `GET /auth/me` on mount and syncing the
  cache. If you add another per-user field that admins can change
  live, it'll show up automatically through this same path — no
  further wiring needed.
- **Docker's build context is not git-aware.** `COPY . .` in a
  Dockerfile picks up locally-present-but-gitignored files (e.g. the
  frontend's `src/lib/mock.ts`) even though they don't exist in a
  fresh clone. If a local scratch file breaks a Docker build,
  `.dockerignore` it explicitly rather than assuming `.gitignore`
  covers it.
- **A literal dynamic `import("./path")` specifier is still statically
  resolved by `tsc` and Rollup**, even inside a runtime `if` that would
  never execute it on a fresh clone. Route the specifier through a
  variable (`const p = "./path"; import(p)`) if the target file is
  gitignored/conditionally present, or the build fails on a clean
  checkout despite working locally.
- **Test data pollutes the shared dev Postgres instance.** There's no
  separate test database — `pytest` runs against the same Postgres
  container as local dev, and several fixtures are session-scoped
  (`test_user`, `admin_user`), so accounts and their data accumulate
  across runs. Tests that create their own throwaway users/lists clean
  up after themselves; if you add a test that doesn't, expect the dev
  DB to slowly fill with `*_<hex>@test.com` accounts.
- **When reverting a feature, check whether the *docs* need reverting
  too**, not just the code — a stale doc describing a removed table/
  endpoint is worse than no doc, since it actively misleads the next
  person. (This happened with the time-tracking DB detour — see
  `docs/TIME_TRACKING.md` for the version that actually shipped.)
