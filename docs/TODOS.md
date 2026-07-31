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
- [ ] Step 9: Seed script for problems + global list
- [ ] Step 10: Consolidate into pytest smoke suite, run end-to-end

Deferred: Dockerfile/docker-compose, CI.
