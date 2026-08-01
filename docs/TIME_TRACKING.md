# Time tracking — developer notes

How "time spent" (Dashboard's "time today" widget and Analytics'
"Time Spent · Last 7 Days" chart) actually works, and why it's built
the way it is.

---

## Where it lives

Everything is in `frontend/src/hooks/use-time-spent.ts`. No backend
endpoint, no database table — it's `localStorage`-only under the key
`kf_time_spent`, storing a `{ "YYYY-MM-DD": secondsThatDay }` map
pruned to the last 7 days on every write.

- `useTimeSpentTracker()` — mounted once in `App.tsx`'s `Layout`.
  Accumulates elapsed wall-clock time into today's entry every 30s,
  on tab-hide, and on unmount/`beforeunload`.
- `useTimeSpentToday()` — the Dashboard widget. Polls the store every
  1s for a live-updating "today" total.
- `useTimeSpentWeek()` — the Analytics chart. Polls every 5s and
  returns the last 7 days, oldest first, in the same shape as the
  `TimeSpentDay` type (`{ date, day, minutes }`).
- `todayKey(d?)` — local (not UTC) date as `YYYY-MM-DD`. Every piece of
  this feature uses this for "what day is it", so the widget and the
  chart can never disagree about which bucket "today" is.

## Why this is client-only, no DB

Tracked once (2026-08-01) with a table (`daily_time_spent`) and a
`POST /user/time-spent` sync endpoint so the data would survive page
reloads/devices and be queryable server-side. That was reverted the
same day: the actual requirement is just "show today, show the last 7
days" — both fit in a few hundred bytes of `localStorage`, so a table,
a migration, a write endpoint, and a sync loop were solving a problem
that didn't exist. Default to *not* reaching for the database when the
data is small, short-lived, and genuinely only needed on the device
that produced it.

**Known trade-off from this choice**, so nobody re-discovers it the
hard way: this data does not sync across devices/browsers and is lost
if the user clears site data. That's accepted as fine for a "how much
have I used this app lately" indicator — if a real requirement shows
up later for this to be durable or cross-device (e.g. a streak feature
that must survive a wiped browser), that's the point where a real
backend-persisted version is justified, not before.

## The bug that started this

The widget and the chart used to disagree (widget: real hours; chart:
0m) because they were never the same metric to begin with. The chart
used to be computed from `solve_logs.time_spent` — a self-reported
bucket (`<15m`/`15-30m`/`30-60m`/`1h+`) attached when a user files a
solve-log entry, not from any actual duration tracking. A day with real
usage but no logged solve showed 0m on the chart while the widget
(which tracks actual open-tab time) showed real hours.

The fix wasn't to sync these two things — they're semantically
different signals — it was to make the chart read from the *same*
source as the widget instead of a disconnected one. `solve_logs.time_spent`
still exists and still powers the separate "Time Trends" bucket-count
chart (`GET /analytics/time-trends`), which is a different, legitimate
use of that field.

## Gotchas if you touch this again

- Each flush is capped at 60s (`MAX_FLUSH_SECONDS`) before being
  recorded, both locally and (there is no "and" anymore, but keep this
  if a sync mechanism ever comes back) anywhere else. Without the cap,
  a laptop waking from sleep with the tab still open computes a huge
  `now - last` gap and would report hours of "active" time for a
  period the user was never actually looking at the screen.
- `useTimeSpentWeek`'s poll interval and `useTimeSpentToday`'s are
  independent — if you change one, the other doesn't need to match;
  they just both need to eventually read the same `localStorage` key.
- If a genuine cross-device/durable requirement shows up later, don't
  bolt a sync loop onto this file — design it as its own feature with
  its own table, informed by knowing which one of "today" vs "history"
  actually needs to survive.
