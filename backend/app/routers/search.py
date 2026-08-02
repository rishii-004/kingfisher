from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.list_problem import ListProblem
from app.models.problem import Problem
from app.models.user import User
from app.schemas.envelope import Envelope
from app.schemas.list import ListResponse
from app.schemas.problem import ProblemResponse
from app.schemas.search import NoteResult, SearchResults
from app.services.auth import get_current_user
from app.services.search import search_lists, search_notes, search_problems

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", response_model=Envelope[SearchResults])
def unified_search(
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not q or not q.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail='Missing "q" param'
        )

    problems = search_problems(db, q)
    notes = search_notes(db, q, str(current_user.id))
    lists = search_lists(db, q, str(current_user.id))

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
        problem_count = db.query(ListProblem).filter(
            ListProblem.list_id == lst.id
        ).count()
        results.append({
            "type": "list",
            "relevance": round(0.75 if q.lower() in lst.name.lower() else 0.6, 2),
            "data": ListResponse(
                id=lst.id,
                name=lst.name,
                description=lst.description,
                is_global=lst.is_global,
                is_custom=lst.is_custom,
                owner_id=lst.owner_id,
                problem_count=problem_count,
                created_at=lst.created_at,
                updated_at=lst.updated_at,
            ),
        })

    results.sort(key=lambda r: r["relevance"], reverse=True)
    total = len(results)
    start = (page - 1) * per_page
    page_items = results[start : start + per_page]

    return Envelope(
        data=SearchResults(results=page_items, total=total, page=page, per_page=per_page)
    )
