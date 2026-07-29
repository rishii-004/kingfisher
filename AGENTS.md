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
kingfisher/
├── AGENTS.md              # This file — agent memory
├── README.md              # Project readme
├── docs/
│   └── ROADMAP.md         # Development roadmap
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI entry point
│   │   ├── config.py       # Settings (pydantic-settings)
│   │   ├── database.py     # DB engine + session
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── routers/        # API route handlers
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers (auth, etc.)
│   ├── alembic/            # Migrations
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature modules
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities + API client
│   │   ├── pages/          # Route pages
│   │   ├── stores/         # State (zustand or context)
│   │   └── types/          # TypeScript types
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
└── docker-compose.yml
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

## How to Run (Development)

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
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

- [x] Repository initialized
- [x] API contract written
- [ ] Backend scaffold
- [ ] Frontend scaffold
- [ ] Database models
- [ ] Auth system
- [ ] API endpoints
- [ ] UI components
- [ ] Integration
- [ ] Testing
- [ ] Deployment

See `docs/ROADMAP.md` for detailed development plan.
