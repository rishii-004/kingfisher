"""Seed the database: the full problem catalog plus two curated global
lists (NeetCode 150 and Striver's A2Z DSA Sheet).

Idempotent: safe to run multiple times (upserts problems by slug —
refreshing their fields too — and skips list memberships that already
exist).

Data lives in scripts/seed_data.py (generated, not hand-edited). Provenance:
  - NeetCode 150: title/difficulty/category from
    github.com/krmanik/Anki-NeetCode (neetcode-150-list.json), 150/150 problems.
  - Striver's A2Z Sheet: problem list + LeetCode links from
    github.com/nileshkr17/A2Z-DSA-Tracker (src/data/ultimateData.js),
    456 total problems on the sheet, 242 have a genuine leetcode.com link
    (verified by domain, not just a truthy string) — the rest (GFG,
    CodingNinjas, InterviewBit, or no link at all) are intentionally
    skipped per product decision: this app only tracks LeetCode problems.
    Difficulty/topics for the 148 of those not already covered by
    NeetCode 150 were fetched from LeetCode's public GraphQL API by slug.
  - Company associations + the remaining ~2,950 catalog problems (title,
    difficulty, topics) come from github.com/liquidslr/leetcode-company-wise-
    problems (per-company "5. All.csv" — the all-time list per company, not
    the 30/90/180-day subsets, to avoid double-counting). 3,250 unique
    LeetCode problems across 440 companies; a company is only attached to a
    problem if that repo's own data says so — nothing fabricated.
  - Topic tags (from either source) are normalized to the frontend's
    canonical topic list (src/lib/topics.ts); finer-grained tags (e.g.
    "Depth-First Search", "Monotonic Stack", "Segment Tree") are mapped
    down to that vocabulary or dropped if no reasonable match exists —
    never fabricated. SQL-only problems end up with no topic tags, which
    is correct (this app's topic vocabulary is algorithmic, not SQL).

Usage:
    python -m scripts.seed
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal  # noqa: E402
from app.models.list import ProblemList  # noqa: E402
from app.models.list_problem import ListProblem  # noqa: E402
from app.models.problem import Problem  # noqa: E402
from scripts.seed_data import LISTS, PROBLEMS  # noqa: E402


def seed():
    db = SessionLocal()
    try:
        problems_by_slug = {}
        for slug, fields in PROBLEMS.items():
            existing = db.query(Problem).filter(Problem.slug == slug).first()
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
                problems_by_slug[slug] = existing
                continue
            p = Problem(slug=slug, **fields)
            db.add(p)
            db.flush()
            problems_by_slug[slug] = p
        db.commit()
        print(f"Seeded {len(problems_by_slug)} problems.")

        for list_def in LISTS:
            global_list = db.query(ProblemList).filter(
                ProblemList.name == list_def["name"], ProblemList.is_global.is_(True)
            ).first()
            if not global_list:
                global_list = ProblemList(
                    name=list_def["name"],
                    description=list_def["description"],
                    is_global=True,
                    is_custom=False,
                )
                db.add(global_list)
                db.flush()
            db.commit()

            existing_problem_ids = {
                row.problem_id
                for row in db.query(ListProblem.problem_id).filter(
                    ListProblem.list_id == global_list.id
                ).all()
            }
            order = len(existing_problem_ids)
            added = 0
            for slug in list_def["slugs"]:
                p = problems_by_slug[slug]
                if p.id in existing_problem_ids:
                    continue
                db.add(ListProblem(list_id=global_list.id, problem_id=p.id, order=order))
                order += 1
                added += 1
            db.commit()
            list_name = list_def["name"]
            print(f"Added {added} problems to '{list_name}' (list_id={global_list.id}).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
