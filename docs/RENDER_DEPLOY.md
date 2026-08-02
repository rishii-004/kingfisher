# kingfisher — Deploying on Render (Docker runtime)

Render deploys the app as two Docker services defined in
[`render.yaml`](../render.yaml) (Infrastructure-as-Code Blueprint), plus an
**external PostgreSQL** (Supabase) that Render doesn't manage:

| Service | Runs | Builds from |
|---|---|---|
| `kingfisher-api` | FastAPI backend, Alembic migrations, Uvicorn | `backend/Dockerfile`, branch `backend` |
| `kingfisher-app` | React SPA served by Caddy, which also proxies `/api/*` to the backend | `frontend/Dockerfile`, branch `frontend` |
| Supabase Postgres | hosted PostgreSQL, managed by Supabase | (not part of the Blueprint) |

The frontend keeps its single-origin model: the browser only ever talks to
`kingfisher-app.onrender.com`; Caddy transparently forwards `/api/*` to the
backend. No CORS dance, no cross-origin cookies.

---

## 1. Prerequisites

- The repo is on GitHub with all three branches pushed and current:
  `main` (deploy config), `backend` (backend source), `frontend` (frontend source).
- A Render account (render.com) and a Supabase project (supabase.com).
  Any hosted Postgres works — the app only needs a `DATABASE_URL`.

## 2. Get the Supabase connection string

1. Supabase dashboard → **Project Settings** → **Database** → **Connection string**.
2. Choose the **Session pooler** tab and copy the **URI**:
   - Session pooler (`:5432` on `*.pooler.supabase.com`) — IPv4, full SQL
     feature compatibility. This is the safest choice for Alembic migrations.
   - The **Transaction pooler** (`:6543`) also works but has transaction-mode
     limitations; prefer the session pooler unless you know you need pooling.
3. Append `?sslmode=require` to the end of the URI.
   (The dashboard URI is already correctly URL-encoded — copy it wholesale;
   hand-typing a password with `@`/`:`/`/` in it will silently break the URL.)

## 3. Deploy (Blueprints)

1. Push the changes that this doc ships with:
   - `backend` branch: `backend/Dockerfile` (PORT-aware), `backend/.env.example`
   - `frontend` branch: `frontend/Caddyfile` (PORT + `/api/*` proxy), `frontend/Dockerfile`
   - `main` branch: `render.yaml`, `.env.render.example`, this doc
2. Render dashboard → **New** → **Blueprint**.
3. Connect the `kingfisher` repo; Render auto-detects `render.yaml` at the root.
4. When prompted, set the values marked `sync: false` in `render.yaml`:
   - `DATABASE_URL` → the Supabase session-pooler URI from step 2 (required).
   - `CORS_ORIGINS` → the frontend's origin, e.g. `https://kingfisher-app.onrender.com`
     (optional — a safety net for direct cross-origin API calls; normal app
     traffic is same-origin via the proxy, so you can leave it blank).
   - `INITIAL_ADMIN_EMAIL` → leave empty unless you want a bootstrap admin.
   - `BACKEND_URL` → the backend's URL, e.g. `https://kingfisher-api.onrender.com`
     (required).
5. Create the Blueprint. Render deploys both services; `SECRET_KEY` is generated
   automatically (`generateValue: true`).

## 4. After the first deploy

The backend runs `alembic upgrade head` on every boot (tables get created),
but the **problem catalog is not seeded automatically** — seeding is a
deliberate, manual act (see `AGENTS.md`).

1. Open **kingfisher-api** → **Shell** and run:

   ```bash
   python -m scripts.seed
   ```

   Idempotent — safe to re-run. Loads ~3,250 problems + NeetCode 150 and
   Striver's A2Z lists (see `scripts/seed.py`'s docstring for provenance).

2. Verify: hit the backend health check at
   `https://kingfisher-api.onrender.com/api/v1/health` → `{"status": "ok"}`,
   then open the frontend URL and register a user.

3. **Bootstrap admin** (optional): if you set `INITIAL_ADMIN_EMAIL`, register
   that email first, then restart the backend service (dashboard → kingfisher-api
   → Restart) so the startup bootstrap promotes it.

## 5. Environment variables (complete list)

See [`.env.render.example`](../.env.render.example) for the annotated checklist.
Render injects `PORT` itself — never set it. `POSTGRES_PASSWORD`/`POSTGRES_USER`/
`POSTGRES_DB` from the compose stack do not apply on Render/Supabase.

### kingfisher-api
| Variable | Set how | Notes |
|---|---|---|
| `DATABASE_URL` | manual (prompted) | **required** — Supabase session-pooler URI + `?sslmode=require` |
| `SECRET_KEY` | auto (`generateValue`) | required; rotate from dashboard if ever exposed |
| `ENVIRONMENT` | auto (`production`) | required; enables the `SECRET_KEY` guard |
| `CORS_ORIGINS` | manual | optional — only for direct cross-origin API calls; normal traffic is same-origin via the proxy |
| `INITIAL_ADMIN_EMAIL` | manual | optional bootstrap admin |
| `DEFAULT_MAX_LISTS` | auto (`30`) | optional per-user list quota |

### kingfisher-app
| Variable | Set how | Notes |
|---|---|---|
| `BACKEND_URL` | manual | **required** — e.g. `https://kingfisher-api.onrender.com`; Caddy's `/api/*` proxy target |

## 6. Updating / redeploying

Render auto-deploys on push to each service's branch (`backend` → API,
`frontend` → app). No Dockerfile change needed for ordinary code updates.
Migrations run automatically on each backend boot (idempotent `upgrade head`).

## 7. Plans, costs, and limits

- **Render web services** are `free`: they sleep after ~15 min idle and the
  first request after an idle period is slower. Upgrade to `starter`+ in the
  dashboard for always-on.
- **Supabase free tier** gives you one free project (500 MB DB, a few thousand
  rows' worth of headroom is fine here) — good enough for this app's scale.
  Connection-wise the app is light: 2 uvicorn workers × SQLAlchemy's default
  pool (5 conns) ≈ up to 10 connections, well under Supabase's pooler limits.
- **Backups:** Supabase handles them on its side; enable the backup add-on if
  you want point-in-time recovery. There's no cron-based `pg_dump` here.
- Render and Supabase are different vendors in different regions — latency is
  a few ms; irrelevant for this workload.

## 8. Custom domain (optional)

Attach your domain in the Render dashboard for either service and Render
provisions TLS automatically. If you add a custom domain to the frontend, add
its origin (`https://yourdomain.com`) to the backend's `CORS_ORIGINS`.

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Backend deploy fails with "SECRET_KEY is still the insecure default" | `ENVIRONMENT` isn't `production`, or `SECRET_KEY` got reset to the default. Set both via dashboard → Environment. |
| Health check fails on first deploy | Let the container boot; migrations (`alembic upgrade head`) run first. Check **kingfisher-api** → **Logs**. |
| Backend logs show a DB connection error | `DATABASE_URL` is wrong — re-copy the Supabase URI (pooler tab) with `?sslmode=require`. |
| Supabase says "ipv6" / connection refused on `db.<ref>.supabase.co:5432` | You used the direct host, which is IPv6-only. Use the `*.pooler.supabase.com` Session pooler host instead. |
| Frontend up but API calls 502 | `BACKEND_URL` missing/wrong on `kingfisher-app`. |
| API works but page is blank / routes 404 | Client-side routing — confirm you're hitting the app through Caddy (any path returns `index.html`). |
| Empty problem catalog / no problems in search | Seed hasn't been run (step 4). |
| CORS errors from dev tools | Direct cross-origin calls to the API need your origin in `CORS_ORIGINS`. Normal app usage is same-origin via the proxy. |
| Container not receiving traffic | Confirm the process listens on `$PORT` (not a hardcoded 8000/80). |

## 10. Security notes

- `render.yaml` stores no secrets; `SECRET_KEY` is generated by Render and only
  `sync: false` values are prompted at creation. `DATABASE_URL` is entered
  once and stored as a Render secret.
- In Supabase, keep the project's **database password** private (it's only in
  `DATABASE_URL` on Render); don't paste it into committed files. You can
  rotate it in Supabase → Project Settings → Database → Reset database
  password, then update `DATABASE_URL` on Render.
- If you ever push a real `.env`, rotate `SECRET_KEY` and the Supabase DB
  password immediately — both are gitignored and must stay that way.
