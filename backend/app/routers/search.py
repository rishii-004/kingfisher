from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.problem import Problem
from app.models.user import User
from app.schemas.problem import ProblemResponse
from app.schemas.search import NoteResult
from app.services.auth import get_current_user
from app.services.search import search_lists, search_notes, search_problems

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
def unified_search(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    problems, p_total = search_problems(db, q, page, per_page)
    notes, n_total = search_notes(db, q, str(current_user.id), page, per_page)
    lists, l_total = search_lists(db, q, str(current_user.id), page, per_page)

    results = []

    for p in problems:
        results.append({
            "type": "problem",
            "relevance": round(0.9 if q.lower() in p.title.lower() else 0.7, 2),
            "data": ProblemResponse.model_validate(p),
        })

    for n in notes:
        problem = db.query(Problem).filter(Problem.id == n.problem_id).first()
        snippet = n.notes[:200] if n.notes else ""
        results.append({
            "type": "note",
            "relevance": 0.8,
            "data": NoteResult(
                problem_id=str(n.problem_id),
                problem_title=problem.title if problem else "",
                notes_snippet=snippet,
            ),
        })

    for lst in lists:
        results.append({
            "type": "list",
            "relevance": round(0.75 if q.lower() in lst.name.lower() else 0.6, 2),
            "data": {
                "id": str(lst.id),
                "name": lst.name,
                "description": lst.description,
                "is_global": lst.is_global,
                "is_custom": lst.is_custom,
                "owner_id": str(lst.owner_id) if lst.owner_id else None,
                "problem_count": 0,
                "created_at": lst.created_at.isoformat() if lst.created_at else None,
                "updated_at": lst.updated_at.isoformat() if lst.updated_at else None,
            },
        })

    total = p_total + n_total + l_total
    return {
        "data": {
            "results": results,
            "total": total,
            "page": page,
            "per_page": per_page,
        },
        "error": None,
    }
