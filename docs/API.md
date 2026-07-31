# kingfisher — API Contract

> Single source of truth for all API endpoints.
> Backend implements these; frontend consumes these.

---

## Conventions

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
- **Access Token** (15min): Sent as `Authorization: Bearer <access_token>`
- **Refresh Token** (7 days): Sent in body for refresh endpoint
- Protected endpoints return `401 Unauthorized` if missing/expired token

### Response Envelope
```typescript
// Success
{ "data": T, "error": null }

// Error
{ "data": null, "error": { "code": "VALIDATION_ERROR", "message": "..." } }

// Paginated
{ "data": { "items": T[], "total": number, "page": number, "per_page": number }, "error": null }
```

### Common Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (delete success) |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (not admin) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable Entity (Pydantic validation) |

### Pagination
Query params: `?page=1&per_page=20` (defaults: page=1, per_page=20)
Response items inside `data.items`, metadata at `data.total`, `data.page`, `data.per_page`.

---

## Entities (Shared Schemas)

### User
```typescript
interface User {
  id: string;           // UUID
  email: string;
  username: string;
  is_admin: boolean;
  max_lists: number;    // owned-list quota (created + forked); ignored for admins
  created_at: string;   // ISO 8601
  updated_at: string;   // ISO 8601
}
```

### Problem
```typescript
interface Problem {
  id: string;                       // UUID
  title: string;
  slug: string;                     // url-friendly unique
  platform: "leetcode" | "gfg" | "neetcode" | "other";
  platform_url: string;
  difficulty: "easy" | "medium" | "hard";
  topic_tags: string[];             // ["Two Pointers", "Trees", "DP", ...]
  company_tags: string[];           // ["Google", "Meta", ...]
  created_at: string;
  updated_at: string;
}
```

### ProblemList
```typescript
interface ProblemList {
  id: string;
  name: string;
  description: string | null;
  is_global: boolean;     // master list (admin-managed)
  is_custom: boolean;     // user-created or forked
  owner_id: string | null; // null for global lists
  problem_count: number;
  created_at: string;
  updated_at: string;
}
```

### ProblemList (with problems)
```typescript
interface ProblemListDetail extends ProblemList {
  problems: (Problem & { order: number })[];
}
```

### UserProblem
```typescript
interface UserProblem {
  user_id: string;
  problem_id: string;
  status: "todo" | "solving" | "solved" | "skipped";
  solved_at: string | null;
  problem: Problem;       // expanded
}
```

### SolveLog
```typescript
interface SolveLog {
  id: string;
  user_id: string;
  problem_id: string;
  mistake_tags: string[];  // ["edge_case_missed", "off_by_one", "tle", ...]
  notes: string;           // markdown
  time_spent: "<15m" | "15-30m" | "30-60m" | "1h+";
  solved_at: string;
}
```

### Review
```typescript
interface Review {
  id: string;
  user_id: string;
  problem_id: string;
  problem: Problem;
  interval_days: number;   // 7 | 14 | 30 | 90
  due_at: string;
  review_stage: number;    // 0 | 1 | 2 | 3
  last_reviewed_at: string | null;
  created_at: string;
}
```

---

## Endpoints

---

### Auth

#### POST /auth/register
Create a new user account.

```
Request:
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securePass123"
}

Response 201:
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "user": { ... User }
  },
  "error": null
}

Errors:
  - 409: Email or username already taken
  - 422: Validation failed
```

#### POST /auth/login
Authenticate and receive tokens.

```
Request:
{
  "email": "user@example.com",
  "password": "securePass123"
}

Response 200:
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "user": { ... User }
  },
  "error": null
}

Errors:
  - 401: Invalid credentials
```

#### POST /auth/refresh
Get a new access token using a refresh token.

```
Request:
{
  "refresh_token": "eyJ..."
}

Response 200:
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",  // rotated
    "token_type": "bearer"
  },
  "error": null
}

Errors:
  - 401: Invalid or expired refresh token
```

#### GET /auth/me
Get the currently authenticated user. [PROTECTED]

```
Response 200:
{
  "data": { ... User },
  "error": null
}

Errors:
  - 401: Not authenticated
```

---

### Problems

#### GET /problems
List/search problems with filters. [PROTECTED]

```
Query Params:
  ?page=1
  &per_page=20
  &q=two+sum               // search title/slug
  &platform=leetcode       // filter by platform
  &difficulty=medium       // filter by difficulty
  &topic=dynamic-programming
  &company=google
  &list_id=<uuid>          // problems in a specific list

Response 200:
{
  "data": {
    "items": [ ... Problem ],
    "total": 42,
    "page": 1,
    "per_page": 20
  },
  "error": null
}
```

#### GET /problems/{id}
Get a single problem by ID or slug. [PROTECTED]

```
Response 200:
{
  "data": { ... Problem },
  "error": null
}

Errors:
  - 404: Problem not found
```

#### GET /problems/platforms
Get list of supported platforms. [PUBLIC]

```
Response 200:
{
  "data": {
    "platforms": [
      { "value": "leetcode", "label": "LeetCode", "logo_url": "/logos/leetcode.svg" },
      { "value": "gfg", "label": "GeeksforGeeks", "logo_url": "/logos/gfg.svg" },
      { "value": "neetcode", "label": "NeetCode", "logo_url": "/logos/neetcode.svg" },
      { "value": "other", "label": "Other", "logo_url": null }
    ]
  },
  "error": null
}
```

---

### Lists

#### GET /lists
List all available lists (global + user's custom). [PROTECTED]

```
Query Params:
  ?page=1&per_page=20
  &type=global|custom       // filter by type

Response 200:
{
  "data": {
    "items": [ ... ProblemList ],
    "total": 10,
    "page": 1,
    "per_page": 20
  },
  "error": null
}
```

#### GET /lists/{id}
Get list details with its problems. [PROTECTED]

```
Response 200:
{
  "data": { ... ProblemListDetail },
  "error": null
}

Errors:
  - 404: List not found
```

#### POST /lists
Create a custom list. [PROTECTED]

```
Request:
{
  "name": "My Top 10 DP Problems",
  "description": "Must-solve DP problems for interviews"
}

Response 201:
{
  "data": { ... ProblemList },
  "error": null
}

Errors:
  - 409: List limit reached (max_lists quota) — not raised for admins
```

#### POST /lists/from-filter
Create a custom list and populate it with every problem currently
matching the given filters (same params as `GET /problems`; at least
one must be set). Meant for the "All Problems" browse page: apply a
filter combination, then turn the whole result set into a list in one
call instead of paging through results and adding problems one by one. [PROTECTED]

```
Request:
{
  "name": "Amazon Medium Array",
  "description": "optional",
  "q": "optional search text",
  "platform": "leetcode",
  "difficulty": "medium",
  "topic": "Array",
  "company": "Amazon"
}

Response 201:
{
  "data": { ... ProblemList },   // problem_count reflects everything added
  "error": null
}

Errors:
  - 422: No filter provided (q/platform/difficulty/topic/company all empty)
  - 400: No problems match these filters
  - 409: List limit reached (max_lists quota) — not raised for admins
```

#### PUT /lists/{id}
Update a custom list (name, description). [PROTECTED]

```
Request:
{
  "name": "Updated Name",
  "description": "Updated description"
}

Response 200:
{
  "data": { ... ProblemList },
  "error": null
}

Errors:
  - 404: List not found
  - 403: Not owner of this list
```

#### DELETE /lists/{id}
Delete a custom list. [PROTECTED]

```
Response 204: No Content

Errors:
  - 404: List not found
  - 403: Not owner of this list
```

#### POST /lists/{id}/fork
Fork a global list into the user's custom lists. [PROTECTED]

```
Response 201:
{
  "data": { ... ProblemList },  // the new forked copy
  "error": null
}

Errors:
  - 404: List not found
  - 400: List is not a global list
  - 409: Already forked this list
  - 409: List limit reached (max_lists quota) — not raised for admins
```

#### POST /lists/{id}/problems
Add a problem to a custom list. [PROTECTED]

```
Request (existing problem):
{
  "problem_id": "uuid",
  "order": 1      // optional, appends to end if omitted
}

Request (problem doesn't exist in the global pool yet — created inline):
{
  "title": "Two Sum",
  "platform": "leetcode",
  "platform_url": "https://leetcode.com/problems/two-sum/",
  "difficulty": "easy",
  "topic_tags": ["Arrays & Hashing"],   // optional
  "company_tags": ["Google"],          // optional
  "slug": "two-sum",                   // optional, derived from title if omitted
  "order": 1                           // optional
}

Response 201:
{
  "data": {
    "list_id": "uuid",
    "problem_id": "uuid",
    "order": 1
  },
  "error": null
}

Errors:
  - 404: List or Problem not found (only applies to the problem_id form)
  - 403: Not owner of this list
  - 409: Problem already in list
  - 422: Neither problem_id nor (title, platform, difficulty) provided

Notes:
  - When creating inline, the problem is get-or-created by slug (or by
    platform_url if slug doesn't match) so re-adding the same URL from
    a different list reuses the existing Problem row instead of
    duplicating it. This does not go through /admin/problems and does
    not require is_admin — it's scoped to "I'm tracking a problem that
    isn't in the system yet," not general problem catalog management.
```

#### POST /lists/{id}/reset
Reset the current user's progress on all problems in a list (global
or a list they own) — clears status back to "todo", solved_at, and
deletes their solve logs and reviews for every problem in that list.
Does not delete the list or remove problems from it. [PROTECTED]

```
Response 204: No Content

Errors:
  - 404: List not found
```

#### DELETE /lists/{id}/problems/{problem_id}
Remove a problem from a custom list. [PROTECTED]

```
Response 204: No Content

Errors:
  - 404: List or Problem not found
  - 403: Not owner of this list
```

---

### User Problems

#### GET /user/problems
List the authenticated user's problems with status. [PROTECTED]

```
Query Params:
  ?page=1&per_page=20
  &status=solved             // filter by status
  &list_id=<uuid>            // problems in a specific list

Response 200:
{
  "data": {
    "items": [ ... UserProblem ],
    "total": 50,
    "page": 1,
    "per_page": 20
  },
  "error": null
}
```

#### GET /user/problems/{problem_id}
Get a single user-problem state. [PROTECTED]

```
Response 200:
{
  "data": { ... UserProblem },
  "error": null
}

Errors:
  - 404: UserProblem not found (return empty status if not tracked)
```

#### PUT /user/problems/{problem_id}/status
Update the status of a problem for the current user.
If status changes to "solved", the backend auto-creates an empty SolveLog and schedules the first review. [PROTECTED]

```
Request:
{
  "status": "solving" | "solved" | "skipped" | "todo"
}

Response 200:
{
  "data": {
    "user_problem": { ... UserProblem },
    "solve_log_required": true   // true if status → "solved", signals frontend to open popup
  },
  "error": null
}

Errors:
  - 404: Problem not found
```

---

### Solve Logs

#### POST /user/problems/{problem_id}/solve-log
Create a solve log (details for a solved problem). [PROTECTED]

```
Request:
{
  "mistake_tags": ["edge_case_missed", "off_by_one"],
  "notes": "## Intuition\nUsed two-pointer approach...",
  "time_spent": "15-30m"
}

Response 201:
{
  "data": { ... SolveLog },
  "error": null
}

Errors:
  - 400: Problem not in "solved" status
  - 409: Solve log already exists (use PUT instead)
```

#### PUT /user/problems/{problem_id}/solve-log
Update an existing solve log. [PROTECTED]

```
Request:
{
  "mistake_tags": ["edge_case_missed"],
  "notes": "## Updated notes\n...",
  "time_spent": "30-60m"
}

Response 200:
{
  "data": { ... SolveLog },
  "error": null
}

Errors:
  - 404: Solve log not found
```

#### GET /user/problems/{problem_id}/solve-log
Get the solve log for a problem. [PROTECTED]

```
Response 200:
{
  "data": { ... SolveLog },
  "error": null
}

Errors:
  - 404: Solve log not found
```

---

### Reviews

#### GET /reviews/due
Get all reviews due for the authenticated user (due_at <= now). [PROTECTED]

```
Query Params:
  ?page=1&per_page=20

Response 200:
{
  "data": {
    "items": [ ... Review ],
    "total": 5,
    "page": 1,
    "per_page": 20
  },
  "error": null
}
```

#### GET /reviews/count
Get count of due reviews (for the banner). [PROTECTED]

```
Response 200:
{
  "data": { "count": 5 },
  "error": null
}
```

#### POST /reviews/{id}/complete
Mark a review as complete and advance to the next interval. [PROTECTED]

```
Request: (empty body)

Response 200:
{
  "data": { ... Review },   // updated with new interval + due_at
  "error": null
}

Errors:
  - 404: Review not found
  - 403: Review does not belong to user
```

---

### Search

#### GET /user/search
Unified search across problems, lists, and solve log notes. [PROTECTED]

```
Query Params:
  ?q=two+sum+binary
  &page=1&per_page=20

Response 200:
{
  "data": {
    "results": [
      {
        "type": "problem",
        "relevance": 0.95,
        "data": { ... Problem }
      },
      {
        "type": "note",
        "relevance": 0.80,
        "data": {
          "problem_id": "uuid",
          "problem_title": "Two Sum",
          "notes_snippet": "...using hashmap approach..."
        }
      },
      {
        "type": "list",
        "relevance": 0.70,
        "data": { ... ProblemList }
      }
    ],
    "total": 15,
    "page": 1,
    "per_page": 20
  },
  "error": null
}

Errors:
  - 400: Missing "q" param
```

---

### Analytics

#### GET /analytics/heatmap?year=2026
Get daily solve counts for the contribution heatmap. Always returns
one entry per day of the year (365/366 entries), zero-filled for days
with no solves. [PROTECTED]

```
Query Params:
  ?year=2026

Response 200:
{
  "data": [
    { "date": "2026-01-01", "count": 3 },
    { "date": "2026-01-02", "count": 0 },
    { "date": "2026-01-03", "count": 1 },
    ...
  ],
  "error": null
}
```

#### GET /analytics/radar
Get per-topic solve counts for the radar chart. [PROTECTED]

```
Response 200:
{
  "data": [
    { "topic": "Arrays & Hashing", "solved": 12 },
    { "topic": "Two Pointers", "solved": 8 },
    { "topic": "Sliding Window", "solved": 5 },
    { "topic": "Stack", "solved": 4 },
    { "topic": "Binary Search", "solved": 7 },
    { "topic": "Trees", "solved": 10 },
    { "topic": "Dynamic Programming", "solved": 6 },
    ...
  ],
  "error": null
}
```

#### GET /analytics/difficulty
Get difficulty breakdown: solved counts plus the total number of
problems that exist per difficulty (global, not user-scoped) so the
frontend can render a "12/25 easy" style ring. [PROTECTED]

```
Response 200:
{
  "data": {
    "easy": 25,
    "medium": 40,
    "hard": 10,
    "easy_total": 60,
    "medium_total": 80,
    "hard_total": 30
  },
  "error": null
}
```

#### GET /analytics/time-trends
Get time spent distribution. [PROTECTED]

```
Response 200:
{
  "data": [
    { "bucket": "<15m", "count": 10 },
    { "bucket": "15-30m", "count": 25 },
    { "bucket": "30-60m", "count": 30 },
    { "bucket": "1h+", "count": 8 }
  ],
  "error": null
}
```

#### GET /analytics/time-spent-week
Get estimated minutes spent per day for the last 7 days (today
inclusive), oldest first. Minutes are a fixed-midpoint estimate per
`time_spent` bucket (`<15m`→10, `15-30m`→22, `30-60m`→45, `1h+`→75).
[PROTECTED]

```
Response 200:
{
  "data": [
    { "date": "2026-07-25", "day": "Sat", "minutes": 0 },
    { "date": "2026-07-26", "day": "Sun", "minutes": 45 },
    ...
  ],
  "error": null
}
```

#### GET /analytics/weekly-pattern
Get all-time solve counts grouped by day of week (Mon–Sun). [PROTECTED]

```
Response 200:
{
  "data": [
    { "day": "Mon", "count": 4 },
    { "day": "Tue", "count": 2 },
    ...
  ],
  "error": null
}
```

#### GET /analytics/topic-mastery
Get per-topic mastery: for every topic tag that appears on any
problem, how many the user solved out of how many exist, how many
completed review cycles touched that topic, and how many mistake
tags were logged against it. [PROTECTED]

```
Response 200:
{
  "data": [
    { "topic": "Dynamic Programming", "solved": 6, "total": 15, "reviews_completed": 2, "mistakes": 3 },
    ...
  ],
  "error": null
}
```

#### GET /analytics/company
Get per-company mastery: solved vs. total problems tagged with that
company. [PROTECTED]

```
Response 200:
{
  "data": [
    { "company": "Google", "solved": 8, "total": 20 },
    ...
  ],
  "error": null
}
```

#### GET /analytics/mistakes
Get a count of each mistake tag (from the controlled vocabulary
below) across the user's solve logs. Always returns all 8 tags, zero
for unused ones, sorted by count descending. [PROTECTED]

```
Response 200:
{
  "data": [
    { "tag": "off_by_one", "label": "Off-by-one", "count": 5 },
    { "tag": "edge_case_missed", "label": "Edge case missed", "count": 3 },
    ...
  ],
  "error": null
}
```

#### GET /analytics/review-pipeline
Get a count of the user's scheduled reviews bucketed by due date. [PROTECTED]

```
Response 200:
{
  "data": {
    "overdue": 2,
    "due_today": 1,
    "due_this_week": 4,
    "due_next_week": 3,
    "due_later": 6
  },
  "error": null
}
```

#### GET /analytics/consistency
Get solve-count rollups and streak data. [PROTECTED]

```
Response 200:
{
  "data": {
    "total_solved": 42,
    "solved_this_month": 8,
    "solved_last_7_days": 3,
    "solved_last_30_days": 12,
    "current_streak": 2,
    "longest_streak": 9
  },
  "error": null
}
```

---

### Admin

All admin endpoints require `is_admin: true`. Returns `403 Forbidden` otherwise.

#### GET /admin/problems
List every problem (not scoped to lists), for the admin problem
management panel. [ADMIN]

```
Query Params:
  ?page=1&per_page=20
  &q=two             // search title/slug

Response 200:
{
  "data": {
    "items": [ ... Problem ],
    "total": 80,
    "page": 1,
    "per_page": 20
  },
  "error": null
}
```

#### POST /admin/problems
Create a new problem (global). [ADMIN]

```
Request:
{
  "title": "Two Sum",
  "slug": "two-sum",
  "platform": "leetcode",
  "platform_url": "https://leetcode.com/problems/two-sum/",
  "difficulty": "easy",
  "topic_tags": ["Arrays & Hashing"],
  "company_tags": ["Google", "Amazon"]
}

Response 201:
{
  "data": { ... Problem },
  "error": null
}

Errors:
  - 409: Problem with this slug already exists
```

#### PUT /admin/problems/{id}
Update a problem. [ADMIN]

```
Request:
{
  "title": "Two Sum (Updated)",
  "difficulty": "medium",
  ...
}

Response 200:
{
  "data": { ... Problem },
  "error": null
}

Errors:
  - 404: Problem not found
```

#### DELETE /admin/problems/{id}
Delete a problem. [ADMIN]

```
Response 204: No Content

Errors:
  - 404: Problem not found
```

#### GET /admin/lists
List every global list, for the admin sheet management panel. [ADMIN]

```
Query Params:
  ?page=1&per_page=20

Response 200:
{
  "data": {
    "items": [ ... ProblemList ],
    "total": 3,
    "page": 1,
    "per_page": 20
  },
  "error": null
}
```

#### POST /admin/lists
Create a global list. [ADMIN]

```
Request:
{
  "name": "NeetCode 150",
  "description": "Curated list of 150 problems covering all patterns"
}

Response 201:
{
  "data": { ... ProblemList },  // is_global: true
  "error": null
}

Errors:
  - 409: List with this name already exists
```

#### PUT /admin/lists/{id}
Update a global list. [ADMIN]

```
Request:
{
  "name": "NeetCode 150 (Updated)",
  "description": "..."
}

Response 200:
{
  "data": { ... ProblemList },
  "error": null
}

Errors:
  - 404: List not found
```

#### DELETE /admin/lists/{id}
Delete a global list. [ADMIN]

```
Response 204: No Content

Errors:
  - 404: List not found
```

#### POST /admin/lists/{id}/problems
Add a problem to a global list. [ADMIN]

```
Request:
{
  "problem_id": "uuid",
  "order": 1
}

Response 201:
{
  "data": { "list_id": "uuid", "problem_id": "uuid", "order": 1 },
  "error": null
}

Errors:
  - 404: List or Problem not found
  - 409: Problem already in list
```

#### DELETE /admin/lists/{id}/problems/{problem_id}
Remove a problem from a global list. [ADMIN]

```
Response 204: No Content

Errors:
  - 404: List or Problem not found
```

#### GET /admin/users
List all registered users. [ADMIN]

```
Query Params:
  ?page=1&per_page=20
  &q=john               // search by username or email

Response 200:
{
  "data": {
    "items": [ ... User ],
    "total": 100,
    "page": 1,
    "per_page": 20
  },
  "error": null
}
```

#### PATCH /admin/users/{id}/toggle-admin
Toggle the admin role of a user. [ADMIN]

```
Request: (empty body or {})

Response 200:
{
  "data": { ... User },  // is_admin toggled
  "error": null
}

Errors:
  - 404: User not found
  - 400: Cannot toggle your own admin status
```

#### PATCH /admin/users/{id}/max-lists
Set a user's custom-list quota (overrides the default of 30). Has no
effect on admins, who are always unlimited. [ADMIN]

```
Request:
{
  "max_lists": 50
}

Response 200:
{
  "data": { ... User },  // max_lists updated
  "error": null
}

Errors:
  - 404: User not found
  - 422: max_lists must be >= 0
```

#### DELETE /admin/users/{id}
Delete a user account. [ADMIN]

```
Response 204: No Content

Errors:
  - 404: User not found
  - 400: Cannot delete yourself
```

---

### Portability

#### GET /user/export
Export all user data as JSON. [PROTECTED]

```
Response 200:
{
  "data": {
    "export_version": "1.0",
    "exported_at": "2026-07-30T12:00:00Z",
    "user": { ... User },
    "user_problems": [ ... UserProblem ],
    "solve_logs": [ ... SolveLog ],
    "reviews": [ ... Review ],
    "custom_lists": [ ... ProblemListDetail ]
  },
  "error": null
}
```

#### POST /user/import
Import user data from a JSON export. Merges with existing data (upserts). [PROTECTED]

```
Request:
Content-Type: application/json

{
  "export_version": "1.0",
  "user_problems": [ ... ],
  "solve_logs": [ ... ],
  "reviews": [ ... ],
  "custom_lists": [ ... ]
}

Response 200:
{
  "data": {
    "imported": {
      "user_problems": 50,
      "solve_logs": 30,
      "reviews": 25,
      "custom_lists": 3
    },
    "errors": []   // list of any items that failed to import
  },
  "error": null
}

Errors:
  - 400: Invalid import format
  - 409: Data conflicts
```

---

## Mistake Tags (Controlled Vocabulary)

These are the predefined mistake tags used in SolveLog:

```typescript
type MistakeTag =
  | "edge_case_missed"
  | "off_by_one"
  | "tle"
  | "wrong_approach"
  | "syntax_error"
  | "didnt_know_pattern"
  | "mle"
  | "other";
```

---

## Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_ERROR` | 422 | Request body failed schema validation |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `TOKEN_EXPIRED` | 401 | Access token expired |
| `FORBIDDEN` | 403 | User lacks admin privileges |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate resource |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `RATE_LIMITED` | 429 | Too many requests |

---

## Frontend Implementation Notes

- All protected endpoints include `Authorization: Bearer <token>` header.
- On 401, the axios interceptor should attempt token refresh before redirecting to login.
- Paginated responses use `{ items, total, page, per_page }` — frontend uses `page` and `per_page` for pagination controls and `total` for display.
- The `solve_log_required` field in the `PUT /user/problems/{problem_id}/status` response tells the frontend whether to open the post-solve popup.
- All date strings are ISO 8601.
