# kingfisher 🐦

> Not just a LeetCode tracker — a full-featured problem-solving companion with spaced repetition, analytics, and multi-user support.

---

## Overview

kingfisher helps developers track, review, and master coding problems. It goes beyond simple checklists with:
- **Spaced repetition** reviews to reinforce learning
- **Post-solve logging** with mistake tags, markdown notes, and time tracking
- **Analytics dashboards** with contribution heatmaps and skill radar charts
- **Custom list management** with database forking for personalized problem sets
- **Multi-user support** with admin roles for managing global master lists (NeetCode 150, Blind 75, etc.)

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Python 3.11+ | Runtime |
| FastAPI | Web framework (async) |
| SQLAlchemy | ORM |
| Pydantic | Data validation / schemas |
| PostgreSQL | Database |
| Alembic | Database migrations |
| python-jose | JWT authentication |
| passlib (bcrypt) | Password hashing |
| pytest + httpx | Testing |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool / dev server |
| Tailwind CSS | Utility-first styling |
| Base UI | Headless, accessible components |
| Cult-UI | Textures, glassmorphism, grid patterns |
| Framer Motion | Animations & transitions |
| Nivo.rocks | HeatMap & Radar charts |
| React Router v6 | Routing |
| React Query | Server state management |
| axios | HTTP client |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker | Containerization |
| docker-compose | Local dev orchestration |
| Caddy / Nginx | Reverse proxy (prod) |
| GitHub Actions | CI/CD |

---

## Requirements

- **Python** 3.11+
- **Node.js** 18+
- **PostgreSQL** 14+ (or Docker)
- **Docker** (optional, for containerized dev)

---

## Project Structure

```
kingfisher/
├── AGENTS.md              # Agent memory bank — read before coding
├── README.md
├── docs/
│   └── ROADMAP.md         # Detailed development plan (9 phases)
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
│   │   ├── features/       # Feature modules (solve-log, review, search, analytics)
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

## Getting Started

### 1. Clone & set up backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy .env template (create one with your DATABASE_URL, SECRET_KEY, etc.)
cp .env.example .env

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload
```

### 2. Set up frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Or run everything with Docker

```bash
docker-compose up
```

---

## Development Roadmap

The project is divided into 9 phases:

| Phase | Description |
|-------|-------------|
| 0 | Project scaffold — both servers bootable |
| 1 | Auth system — register, login, JWT |
| 2 | Core models — problems, lists, CRUD |
| 3 | User problem state & post-solve popup |
| 4 | Spaced repetition & daily dashboard |
| 5 | Search & analytics dashboard |
| 6 | Portability (export/import) & polish |
| 7 | Admin dashboard & multi-user features |
| 8 | Testing & CI/CD |
| 9 | Deployment |

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full detailed plan.

---

## API Contract

Full API specification is at [docs/API.md](docs/API.md) — the single source of truth for all endpoints, request/response schemas, auth requirements, and error codes. Both backend and frontend development reference this document.

---

## Architecture Highlights

- **Database Forking:** Modifying a global list creates a user-specific copy, keeping master lists pristine
- **Spaced Repetition:** Modified Leitner system — intervals expand 7d → 14d → 30d → 90d
- **JWT Auth:** Access tokens (15min) + refresh tokens (7 days)
- **Admin Gate:** `is_admin` column controls write access to global master lists

---

## License

MIT
