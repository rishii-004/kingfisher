# kingfisher — Development Roadmap

> Detailed, sequential development plan broken into phases and chunks.
> Each phase builds on the previous one. Do not skip phases.

---

## Phase 0: Project Scaffold (estimated: 1 session)

Goal: Boot up both servers with empty but working shells.

### Backend Scaffold
- [ ] Initialize `backend/` with `requirements.txt`:
  - `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `psycopg2-binary`, `alembic`, `pydantic-settings`, `python-jose[cryptography]`, `passlib[bcrypt]`, `python-multipart`
- [ ] Create `app/main.py` — FastAPI app instance, CORS middleware, root health-check endpoint (`GET /api/v1/health`)
- [ ] Create `app/config.py` — `Settings` class with `pydantic-settings` (DATABASE_URL, SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, etc.)
- [ ] Create `app/database.py` — SQLAlchemy engine, `SessionLocal` factory, `Base` declarative base
- [ ] Create `app/models/__init__.py` — import all models
- [ ] Create `app/routers/__init__.py` — include all routers
- [ ] Create `app/schemas/__init__.py`
- [ ] Create `app/services/__init__.py`
- [ ] Create `app/utils/__init__.py`
- [ ] Create `app/utils/auth.py` — JWT creation/verification helpers
- [ ] Initialize Alembic: `alembic init alembic` inside `backend/`, configure `alembic.ini` to point to the database
- [ ] Verify server starts: `uvicorn app.main:app --reload`

### Frontend Scaffold
- [ ] `npm create vite@latest frontend -- --template react-ts`
- [ ] Install dependencies: `tailwindcss`, `@base-ui-components/react`, `cult-ui`, `framer-motion`, `@nivo/heatmap`, `@nivo/radar`, `react-router-dom`, `@tanstack/react-query`, `axios`
- [ ] Configure Tailwind: `tailwind.config.ts` with content paths, dark mode, custom colors
- [ ] Set up `postcss.config.js`
- [ ] Create `src/main.tsx` — React 18 `createRoot` entry + React Router + QueryClientProvider
- [ ] Create `src/App.tsx` — Router outlet shell with placeholder pages
- [ ] Create `src/lib/api.ts` — axios instance with base URL and interceptors (attach JWT)
- [ ] Create `src/lib/query-client.ts` — `QueryClient` with defaults
- [ ] Create `src/types/index.ts` — shared TypeScript interfaces
- [ ] Create placeholder pages: `Login`, `Register`, `Dashboard`, `Problems`, `Lists`, `Review`
- [ ] Verify dev server starts: `npm run dev`
- [ ] Configure `vite.config.ts` proxy to backend (`/api` → `http://localhost:8000`)

### Docker
- [ ] Create `backend/Dockerfile` (Python 3.11-slim, install deps, run uvicorn)
- [ ] Create `frontend/Dockerfile` (Node 18, build, nginx serve)
- [ ] Create `docker-compose.yml` with services: backend, frontend, postgres (optional)

---

## Phase 1: Auth System (estimated: 1-2 sessions)

Goal: Users can register, log in, and receive JWT tokens.

### Backend Auth
- [ ] Create `app/models/user.py` — SQLAlchemy model:
  - `id` UUID (primary key)
  - `email` (unique, indexed)
  - `username` (unique, indexed)
  - `hashed_password`
  - `is_admin` (boolean, default False)
  - `created_at`, `updated_at` timestamps
- [ ] Run first Alembic migration: `alembic revision --autogenerate -m "create users table"`
- [ ] Create `app/schemas/auth.py`:
  - `UserCreate` (email, username, password)
  - `UserLogin` (email, password)
  - `UserResponse` (id, email, username, is_admin, created_at)
  - `TokenResponse` (access_token, refresh_token, token_type, user: UserResponse)
- [ ] Create `app/services/auth.py`:
  - `hash_password(password)` — passlib bcrypt
  - `verify_password(plain, hashed)`
  - `create_access_token(data: dict)`
  - `create_refresh_token(data: dict)`
  - `decode_token(token) -> dict`
  - `get_current_user(token) -> User` dependency
- [ ] Create `app/routers/auth.py`:
  - `POST /api/v1/auth/register` — create user, return tokens
  - `POST /api/v1/auth/login` — verify credentials, return tokens
  - `POST /api/v1/auth/refresh` — accept refresh token, issue new access token
  - `GET /api/v1/auth/me` — return current user info (protected)
- [ ] Write tests for auth endpoints

### Frontend Auth
- [ ] Create `src/stores/auth-store.ts` — zustand store or context for auth state (user, tokens, isAuthenticated)
- [ ] Create `src/hooks/use-auth.ts` — login, register, logout, refreshToken functions
- [ ] Build `src/pages/Login.tsx` — email + password form, submit calls API, stores token, redirects to dashboard
- [ ] Build `src/pages/Register.tsx` — username + email + password + confirm, calls register API
- [ ] Create `src/components/ProtectedRoute.tsx` — checks auth, redirects to login if unauthenticated
- [ ] Set up axios interceptor in `src/lib/api.ts` to attach `Authorization: Bearer <token>` and handle 401 by refreshing

---

## Phase 2: Core Problem & List Models (estimated: 1-2 sessions)

Goal: Problems and lists exist in the database; admins can manage them.

### Backend Models
- [ ] Create `app/models/problem.py`:
  - `id` UUID
  - `title` string
  - `slug` string (unique, url-friendly)
  - `platform` enum (leetcode, gfg, neetcode, other)
  - `platform_url` string
  - `difficulty` enum (easy, medium, hard)
  - `topic_tags` ARRAY[string] or JSON (e.g., ["Two Pointers", "Dynamic Programming"])
  - `company_tags` ARRAY[string] (e.g., ["Google", "Meta"])
  - `created_at`, `updated_at`
- [ ] Create `app/models/list.py`:
  - `id` UUID
  - `name` string
  - `description` text (nullable)
  - `is_global` boolean (True for master lists)
  - `is_custom` boolean (True for user-created lists)
  - `owner_id` UUID FK -> users.id (nullable for global lists)
  - `created_at`, `updated_at`
- [ ] Create `app/models/list_problem.py` — join table:
  - `list_id` FK -> lists.id
  - `problem_id` FK -> problems.id
  - `order` integer (position in list)
  - Composite PK on (list_id, problem_id)
- [ ] Create `app/models/user_problem.py` — user's personal problem state:
  - `user_id` FK -> users.id
  - `problem_id` FK -> problems.id
  - `status` enum (todo, solving, solved, skipped)
  - `solved_at` datetime (nullable)
  - Composite PK on (user_id, problem_id)
- [ ] Run Alembic migration

### Admin Endpoints
- [ ] Create `app/routers/admin.py`:
  - `POST /api/v1/admin/problems` — create problem (admin only)
  - `PUT /api/v1/admin/problems/{id}` — update problem (admin only)
  - `DELETE /api/v1/admin/problems/{id}` — delete problem (admin only)
  - `POST /api/v1/admin/lists` — create global list (admin only)
  - `PUT /api/v1/admin/lists/{id}` — update global list (admin only)
  - `DELETE /api/v1/admin/lists/{id}` — delete global list (admin only)
  - `POST /api/v1/admin/lists/{id}/problems` — add problem to list
  - `DELETE /api/v1/admin/lists/{id}/problems/{problem_id}` — remove problem from list
- [ ] Create `app/routers/lists.py` (user-facing):
  - `GET /api/v1/lists` — list all global lists + user's custom lists
  - `GET /api/v1/lists/{id}` — get list with problems
  - `POST /api/v1/lists` — create custom list (fork logic)
  - `PUT /api/v1/lists/{id}` — update custom list name
  - `DELETE /api/v1/lists/{id}` — delete custom list
  - `POST /api/v1/lists/{id}/fork` — fork a global list into user's custom lists
  - `POST /api/v1/lists/{id}/problems` — add problem to custom list
  - `DELETE /api/v1/lists/{id}/problems/{problem_id}` — remove from custom list
- [ ] Create `app/routers/problems.py`:
  - `GET /api/v1/problems` — search/filter problems (by platform, difficulty, topic, company, list)
  - `GET /api/v1/problems/{id}` — get single problem
  - `GET /api/v1/problems/platforms` — return supported platforms
- [ ] Write tests for all list and problem CRUD

---

## Phase 3: User Problem State & Post-Solve Popup (estimated: 1-2 sessions)

Goal: Users can track problem status, and get the post-solve popup when marking as solved.

### Backend
- [ ] Create `app/services/user_problem.py`:
  - `set_status(user_id, problem_id, status)` — update or create user_problem row
  - `get_user_problems(user_id, filters)` — query with optional filters
  - `get_user_problem(user_id, problem_id)` — single
- [ ] Create `app/routers/user_problems.py`:
  - `PUT /api/v1/user/problems/{problem_id}/status` — set status (triggers post-solve logic if status → solved)
  - `GET /api/v1/user/problems` — list user's problems with status, filters
  - `GET /api/v1/user/problems/{problem_id}` — get single user problem state
- [ ] Create `app/models/solve_log.py`:
  - `id` UUID
  - `user_id` FK -> users.id
  - `problem_id` FK -> problems.id
  - `mistake_tags` JSON (array of strings: ["edge_case", "off_by_one", "tle", "wrong_approach", ...])
  - `notes` text (markdown)
  - `time_spent` enum (<15m, 15-30m, 30-60m, 1h+)
  - `solved_at` datetime
- [ ] Create `app/services/solve_log.py`:
  - `create_solve_log(...)` — creates the log + triggers spaced repetition scheduling
  - `update_solve_log(...)`
  - `get_solve_log(user_id, problem_id)`
- [ ] Create `app/routers/solve_logs.py`:
  - `POST /api/v1/user/problems/{problem_id}/solve-log` — create solve log (triggered by status → solved)
  - `PUT /api/v1/user/problems/{problem_id}/solve-log` — update solve log
  - `GET /api/v1/user/problems/{problem_id}/solve-log` — get solve log

### Frontend — Post-Solve Popup
- [ ] Build `src/features/solve-log/SolveLogPopup.tsx`:
  - Base UI Dialog component
  - Markdown textarea for intuition/code notes
  - Mistake tags as multi-select pills (preset list: Edge case missed, Off-by-one, TLE, Wrong approach, Syntax error, Didn't know pattern, Memory limit exceeded, Other)
  - Time spent dropdown (<15m, 15-30m, 30-60m, 1h+)
  - "Schedule review" toggle (default on)
  - Submit button → POST to solve_log endpoint
- [ ] Build `src/features/solve-log/MistakeTagSelect.tsx` — reusable pill selector component
- [ ] Create `src/hooks/use-solve-log.ts` — hook wrapping API calls
- [ ] Wire up: when problem status changes to "Solved" → auto-open SolveLogPopup
- [ ] Platform detection helper: `src/lib/platform.ts` — parse URL and return platform enum + mini logo

---

## Phase 4: Spaced Repetition & Daily Dashboard (estimated: 1 session)

Goal: Review queue with spaced repetition scheduling.

### Backend
- [ ] Create `app/models/review.py`:
  - `id` UUID
  - `user_id` FK -> users.id
  - `problem_id` FK -> problems.id
  - `solve_log_id` FK -> solve_logs.id
  - `interval_days` integer (current interval: 7, 14, 30, 90)
  - `due_at` datetime
  - `review_stage` integer (0, 1, 2, 3 — corresponds to interval tier)
  - `last_reviewed_at` datetime (nullable)
  - `created_at`
- [ ] Create `app/services/spaced_repetition.py`:
  - `schedule_first_review(solve_log_id, user_id, problem_id)` — set due_at = now + 7 days, stage = 0
  - `advance_review(review_id)` — move to next stage (7→14→30→90 or cap at 90)
  - `get_due_reviews(user_id)` — query reviews where due_at <= now
  - `get_review_count(user_id)` — count due items for banner
  - `complete_review(review_id)` — mark reviewed, advance interval
- [ ] Create `app/routers/reviews.py`:
  - `GET /api/v1/reviews/due` — get due reviews with problem details
  - `GET /api/v1/reviews/count` — get count for banner
  - `POST /api/v1/reviews/{id}/complete` — mark review complete, bump interval

### Frontend — Daily Dashboard
- [ ] Build `src/features/review/DueTodayBanner.tsx` — prominent counter at top of app, "X reviews due today"
- [ ] Build `src/features/review/ReviewQueue.tsx`:
  - List of due problems with problem title, platform, difficulty
  - Each item has "Complete Review" button
  - On complete: show quick recap (optional) then bump
- [ ] Build `src/pages/Dashboard.tsx` — main dashboard layout with DueTodayBanner + recent activity feed
- [ ] Create `src/hooks/use-reviews.ts` — hooks for due reviews, count, complete

---

## Phase 5: Search & Analytics Dashboard (estimated: 2 sessions)

Goal: Full-text search, contribution heatmap, and radar skill chart.

### Backend — Search
- [x] Create `app/services/search.py`:
  - `search_problems(query, filters)` — search by title, tags, notes
  - `search_notes(query, user_id)` — search user's solve log notes
- [x] Extend `GET /api/v1/problems` with search query parameter
- [x] Create `GET /api/v1/user/search?q=<query>` — unified search across problems + notes

### Backend — Analytics
- [x] Create `app/services/analytics.py`:
  - `get_heatmap_data(user_id, year)` — daily solve/review counts for contribution heatmap
  - `get_radar_data(user_id)` — topic-wise solve counts mapped to pattern categories
  - `get_difficulty_breakdown(user_id)` — easy/medium/hard counts
  - `get_time_spent_trends(user_id)` — aggregate time spent data
- [x] Create `app/routers/analytics.py`:
  - `GET /api/v1/analytics/heatmap?year=2026`
  - `GET /api/v1/analytics/radar`
  - `GET /api/v1/analytics/difficulty`
  - `GET /api/v1/analytics/time-trends`

### Frontend — Global Search
- [ ] Build `src/features/search/CommandPalette.tsx`:
  - Base UI Popover / Dialog + keyboard shortcut (Cmd+K / Ctrl+K)
  - Input with debounced search query
  - Results grouped by type (Problems, Lists, Notes)
  - Navigate with arrow keys, select to go to problem/list page
- [ ] Create `src/hooks/use-search.ts` — debounced search hook

### Frontend — Analytics Dashboard
- [ ] Build `src/pages/Analytics.tsx` (or tab within Dashboard):
  - **Contribution Heatmap**: Nivo HeatMap component — 7 columns (days) × ~53 rows (weeks), color intensity by solve count
  - **Radar Chart**: Nivo Radar — axes for each pattern category, value = solves in that category
  - **Difficulty Breakdown**: simple bar/pie chart (Recharts or Tailwind-styled)
  - **Time Spent Summary**: bar chart showing time distribution
- [ ] Create `src/hooks/use-analytics.ts` — hooks fetching heatmap, radar, breakdown data
- [ ] Ensure dark mode styling across all charts

---

## Phase 6: Portability & Polish (estimated: 1 session)

Goal: Export/import, error states, loading states, responsive design.

### Backend — Export/Import
- [x] Create `app/services/portability.py`:
  - `export_user_data(user_id)` — JSON dump of all user problems, solve logs, reviews, custom lists
  - `import_user_data(user_id, data)` — restore from JSON (validate, upsert)
- [x] Create `app/routers/portability.py`:
  - `GET /api/v1/user/export` — download JSON
  - `POST /api/v1/user/import` — upload and restore JSON
  - Protect both endpoints with auth

### Frontend — Portability
- [ ] Add "Export Data" button in Settings/Profile page → triggers download
- [ ] Add "Import Data" button → file picker, upload, confirm dialog
- [ ] Build `src/pages/Settings.tsx` — profile info, export/import, account management

### Polish
- [ ] Loading skeletons for all data-fetching pages
- [ ] Error boundaries + toast notifications for API errors
- [ ] Empty states (no reviews due, no problems in list, etc.) with illustrations
- [ ] Responsive layout: sidebar collapses to bottom nav on mobile
- [ ] Dark mode toggle and persistence

---

## Phase 7: Admin Dashboard & Multi-User Features (estimated: 1-2 sessions)

Goal: Admin panel, moderation tools, prepared for scale.

### Admin Frontend
- [ ] Build `src/pages/Admin.tsx` (protected: `user.is_admin`):
  - Problem CRUD form (title, url, platform, difficulty, tags)
  - List CRUD form (name, description, add/remove problems)
  - User management view (list users, toggle admin role)
- [ ] Admin-only navigation links (hidden from non-admins)

### Backend — Admin Enhancements
- [x] Add `GET /api/v1/admin/users` — list all users (admin only)
- [x] Add `PATCH /api/v1/admin/users/{id}/toggle-admin` — toggle is_admin
- [x] Add `DELETE /api/v1/admin/users/{id}` — delete user

### Scaling Prep (deferred — not needed at current traffic levels)
- [x] Add pagination to all list endpoints (already following `?page=&per_page=` convention)
- [~] Add rate limiting middleware
- [~] Add request logging middleware
- [~] Database connection pooling tuning in `database.py`

---

## Phase 8: Testing & CI/CD (estimated: 1 session)

Goal: Automated tests, CI pipeline, production readiness.

### Backend Testing (pending)
- [ ] Test all auth endpoints (register, login, refresh, me)
- [ ] Test admin CRUD for problems and lists
- [ ] Test user problem status transitions
- [ ] Test spaced repetition scheduling logic
- [ ] Test search and analytics endpoints
- [ ] Test export/import round-trip
- [ ] Aim for 80%+ coverage with pytest + httpx

### Frontend Testing
- [ ] Set up Vitest + Testing Library
- [ ] Test SolveLogPopup state transitions
- [ ] Test ProtectedRoute behavior
- [ ] Test auth store flows
- [ ] Component snapshot tests for key pages

### CI/CD
- [ ] Create `.github/workflows/ci.yml`:
  - Trigger: push to main/dev, PRs
  - Backend: setup Python, install deps, run ruff lint, run pytest
  - Frontend: setup Node, npm ci, run tsc --noEmit, run vitest
  - Optional: build Docker images
- [ ] Create `.github/workflows/deploy.yml` (stub for future deployment)

---

## Phase 9: Deployment (estimated: 1 session)

Goal: Run in production.

- [ ] Set up Caddy/Nginx reverse proxy config in `docker-compose.prod.yml`
- [ ] Configure environment variables for production (SECRET_KEY, DATABASE_URL, etc.)
- [ ] Set up PostgreSQL managed database (Render, Railway, Supabase)
- [ ] Deploy backend as container
- [ ] Deploy frontend as container (nginx serves built files)
- [ ] Configure custom domain + SSL
- [ ] Run seed script for default lists (NeetCode 150, Blind 75)

---

## Future Ideas (Post-MVP)

- [ ] **LeetCode API integration** — auto-fetch problem details from URL
- [ ] **Collaborative lists** — share lists with other users
- [ ] **Leaderboards** — compare streaks and solves with friends
- [ ] **Browser extension** — quick-add problems from LeetCode page
- [ ] **Mobile app** — React Native wrapper
- [ ] **AI-powered hints** — LLM integration for problem hints
- [ ] **Email reminders** — daily digest of due reviews

---

## Development Guidelines

1. **Always read AGENTS.md first** — it contains the memory bank for the project.
2. **One phase at a time** — complete all tasks in a phase before moving to the next.
3. **Backend first, then frontend** — always build the API before the UI that consumes it.
4. **Write tests alongside code** — don't punt testing to the end.
5. **Commit after each logical chunk** — use conventional commits.
6. **Run linting before committing** — `ruff check .` for Python, `tsc --noEmit` for TS.
