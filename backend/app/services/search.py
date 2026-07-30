from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.list import ProblemList
from app.models.problem import Problem
from app.models.solve_log import SolveLog


def search_problems(
    db: Session, query: str, page: int = 1, per_page: int = 20
):
    q = db.query(Problem).filter(
        or_(
            Problem.title.ilike(f"%{query}%"),
            Problem.slug.ilike(f"%{query}%"),
            Problem.topic_tags.any(query),
        )
    )
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def search_notes(
    db: Session, query: str, user_id: str, page: int = 1, per_page: int = 20
):
    q = db.query(SolveLog).filter(
        SolveLog.user_id == user_id,
        SolveLog.notes.ilike(f"%{query}%"),
    )
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def search_lists(
    db: Session, query: str, user_id: str, page: int = 1, per_page: int = 20
):
    q = db.query(ProblemList).filter(
        or_(
            ProblemList.name.ilike(f"%{query}%"),
            ProblemList.description.ilike(f"%{query}%"),
        ),
        or_(
            ProblemList.is_global.is_(True),
            ProblemList.owner_id == user_id,
        ),
    )
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def unified_search(
    db: Session, query: str, user_id: str, page: int = 1, per_page: int = 20
):
    problems, p_total = search_problems(db, query, page, per_page)
    notes, n_total = search_notes(db, query, user_id, page, per_page)
    lists, l_total = search_lists(db, query, user_id, page, per_page)

    results = []

    for p in problems:
        results.append({
            "type": "problem",
            "relevance": 0.9 if query.lower() in p.title.lower() else 0.7,
            "data": p,
        })

    for n in notes:
        snippet = n.notes[:200] if n.notes else ""
        results.append({
            "type": "note",
            "relevance": 0.8,
            "data": {
                "problem_id": str(n.problem_id),
                "problem_title": "",
                "notes_snippet": snippet,
            },
        })

    for lst in lists:
        results.append({
            "type": "list",
            "relevance": 0.75 if query.lower() in lst.name.lower() else 0.6,
            "data": lst,
        })

    total = p_total + n_total + l_total
    return results, total
