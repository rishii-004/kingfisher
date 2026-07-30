# kingfisher — Agent Memory Bank

This file serves as persistent memory for AI agents working on this project.
Read this first before making any changes.

---

## Project Overview

**kingfisher** is a full-stack LeetCode/problem-solving tracker that goes beyond simple tracking. It includes spaced repetition for reviews, detailed post-solve logging, analytics dashboards (heatmaps, radar charts), custom list management, and multi-user support with admin roles.

---

## Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **ORM:** SQLAlchemy + Pydantic
- **Database:** PostgreSQL
- **Migrations:** Alembic
- **Auth:** python-jose (JWT) + passlib (bcrypt)
- **Testing:** pytest + httpx (async)

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Headless UI:** Base UI (Radix-based, unstyled primitives)
- **Aesthetic Layer:** Cult-UI (textures, glassmorphism, grid patterns)
- **Animation:** Motion.dev / Framer Motion
- **Charts:** Nivo.rocks (HeatMap + Radar)
- **Routing:** React Router v6
- **HTTP Client:** React Query + axios

### Infrastructure
- **Containerization:** Docker / docker-compose (dev)
- **Reverse Proxy:** Caddy or Nginx (prod)
- **CI/CD:** GitHub Actions

---

## Architecture Decisions

1. **Database Forking for Lists** — When a user modifies a default master list (NeetCode 150), the backend forks the data into a user-specific table instead of mutating the global record.
2. **Post-Solve Popup** — Triggered immediately when a problem status changes to "Solved". Modal dialog with markdown notes, mistake tags, time-spent dropdown, and spaced repetition scheduling.
3. **Spaced Repetition** — Uses a modified Leitner system. First review due 1 week after solving, then intervals expand (7d → 14d → 30d → 90d).
4. **Admin Flag** — `is_admin` boolean column on users table gates write access to global master lists.
5. **JWT Auth** — Access + refresh token pattern. Access tokens short-lived (15min), refresh tokens longer (7 days).

---

## Directory Structure

```
kingfisher-parent/
├── kingfisher/              # Main repo (main branch) — shared docs, AGENTS.md
│   ├── AGENTS.md            # This file — agent memory
│   ├── README.md            # Project readme
│   ├── docs/
│   │   ├── ROADMAP.md       # Development roadmap
│   │   └── API.md           # API contract
│   ├── backend/             # Backend source (committed from backend branch worktree)
│   └── frontend/            # Frontend source (committed from frontend branch worktree)
│
├── kingfisher-backend/      # Worktree (backend branch) — backend-only development
│   ├── AGENTS.md → symlink? No, each worktree has its own copy
│   ├── backend/
│   │   ├── app/
│   │   │   ├── main.py      # FastAPI entry point
│   │   │   ├── config.py    # Settings (pydantic-settings)
│   │   │   ├── database.py  # DB engine + session
│   │   │   ├── models/      # SQLAlchemy models
│   │   │   ├── schemas/     # Pydantic schemas
│   │   │   ├── routers/     # API route handlers
│   │   │   ├── services/    # Business logic
│   │   │   └── utils/       # Helpers (auth, etc.)
│   │   ├── alembic/         # Migrations
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── docs/
│   └── README.md
│
└── kingfisher-frontend/     # Worktree (frontend branch) — frontend-only development
    ├── frontend/
    │   ├── src/
    │   │   ├── components/  # Reusable UI components
    │   │   ├── features/    # Feature modules
    │   │   ├── hooks/       # Custom hooks
    │   │   ├── lib/         # Utilities + API client
    │   │   ├── pages/       # Route pages
    │   │   ├── stores/      # State (zustand or context)
    │   │   └── types/       # TypeScript types
    │   ├── public/
    │   ├── package.json
    │   ├── vite.config.ts
    │   └── Dockerfile
    ├── docs/
    └── README.md
```

---

## Conventions

### Code Style
- **Python:** Follow PEP 8, use `ruff` for linting, `black` for formatting
- **TypeScript:** Use strict mode, prefer interfaces over types for objects
- **Imports:** Group by: 1) stdlib/external, 2) internal, with blank line between
- **Naming:** `snake_case` for Python, `camelCase` for TS/JS, `PascalCase` for components

### Git
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, etc.)
- Branches: `main`, `dev`, `feat/<name>`, `fix/<name>`

### API
- RESTful endpoints at `/api/v1/...`
- Responses follow `{ "data": ..., "error": ... }` envelope
- Pagination: `?page=1&per_page=20` with `{ "items": [], "total": N, "page": N, "per_page": N }`

---

## Git Workflow with Worktrees

This project uses **git worktrees** to develop backend and frontend simultaneously from a single repository.

### Setup (done once)

```bash
# Main repo (already cloned)
cd kingfisher-parent/kingfisher

# Create branches for each domain (done)
git branch backend main
git branch frontend main

# Create worktrees (done)
git worktree add ../kingfisher-backend backend
git worktree add ../kingfisher-frontend frontend
```

### Daily workflow

```bash
# Work on backend — edit in kingfisher-backend/
cd ../kingfisher-backend
git add -A && git commit -m "feat: ..."
git push origin backend

# Work on frontend — edit in kingfisher-frontend/
cd ../kingfisher-frontend
git add -A && git commit -m "feat: ..."
git push origin frontend

# Sync shared docs back to main
cd ../kingfisher
git pull origin main
git checkout backend -- docs/   # pull doc updates from backend
git checkout frontend -- docs/  # pull doc updates from frontend
```

### Agent instructions

When asked to build or modify:
- **Backend work** → worktree at `../../kingfisher-backend/backend/`, branch `backend`
- **Frontend work** → worktree at `../../kingfisher-frontend/frontend/`, branch `frontend`
- **Shared docs/AGENTS.md** → main repo `../../kingfisher/`, branch `main`
- Always read `AGENTS.md` first before making changes.
- When running backend commands (uvicorn, pytest, alembic), do so from the backend worktree.
- When running frontend commands (npm, vite), do so from the frontend worktree.
- Commit changes on the correct branch (backend → `backend`, frontend → `frontend`, docs → `main`).

## How to Run (Development)

```bash
# Backend (from kingfisher-backend)
cd ../kingfisher-backend/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (from kingfisher-frontend)
cd ../kingfisher-frontend/frontend
npm install
npm run dev

# Full stack
docker-compose up
```

---

## Key Documents

- **`docs/ROADMAP.md`** — Development plan (9 phases)
- **`docs/API.md`** — Complete API contract (all endpoints, schemas, errors)
- **`AGENTS.md`** — This file

## Current Status

### Backend (branch `backend`) — Complete
- [x] Phases 1-4: Auth, Models, CRUD, Solve Logs, Spaced Repetition
- [x] Phase 5: Search & Analytics endpoints
- [x] Phase 6: Export/Import portability
- [x] Phase 7: Admin CRUD
- [~] Phase 7: Scaling prep (deferred)
- [ ] Phase 8: Tests (pending)
- [ ] Phase 9: Deployment

### Frontend (branch `frontend`) — Not started
- [ ] All UI components, pages, hooks

See `docs/ROADMAP.md` for detailed development plan.
