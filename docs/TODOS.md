# Backend Completion — Step-by-Step Plan

Verified against live Postgres on `:5433` after each step.
All responses must follow the `{ "data": ..., "error": ... }` envelope from `docs/API.md`.

- [x] Step 1: Envelope foundation + Auth router (register/login/refresh/me)
- [x] Step 2: Problems router — fix `/platforms` shadowing, make it public, envelope
- [x] Step 3: Lists router — pagination, envelope, order field, reset-on-global
- [x] Step 4: User problems + solve logs — envelope, 404, problem object
- [x] Step 5: Reviews router — envelope count + complete
- [x] Step 6: Search & portability — verify, tighten missing-q to 400
- [x] Step 7: Admin — GET problems/lists/users, toggle-admin, delete user, envelope writes
- [x] Step 8: Analytics — add 7 missing endpoints + difficulty totals
- [x] Step 9: Seed script for problems + global list
- [x] Step 10: Consolidate into pytest smoke suite, run end-to-end

Deferred: Dockerfile/docker-compose, CI.

## Backend complete — moving to frontend wiring

All 10 steps above are done: every router follows the envelope
contract, admin/search/portability/analytics gaps are closed, the DB
is seeded with 80 problems in a global list, and 58 pytest tests pass
twice back-to-back with no leaked state. See docs/API.md for the (now
slightly extended) contract — admin listing endpoints, list-add
inline problem creation, and the 7 extra analytics endpoints were
added beyond the original spec to match what the frontend needed.

Next: wire the frontend (currently mocked in dev via lib/mock.ts) to
this real backend and fix the frontend-side gaps found in the earlier
audit.
