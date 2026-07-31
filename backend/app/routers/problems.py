import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.list_problem import ListProblem
from app.models.problem import Problem
from app.schemas.envelope import Envelope, Paginated
from app.schemas.problem import (
    PlatformInfo,
    PlatformsResponse,
    ProblemResponse,
)
from app.services.auth import get_current_user

router = APIRouter()


PLATFORMS = [
    PlatformInfo(value="leetcode", label="LeetCode", logo_url="/logos/leetcode.svg"),
    PlatformInfo(value="gfg", label="GeeksforGeeks", logo_url="/logos/gfg.svg"),
    PlatformInfo(value="neetcode", label="NeetCode", logo_url="/logos/neetcode.svg"),
    PlatformInfo(value="other", label="Other", logo_url=None),
]


@router.get("/platforms", response_model=Envelope[PlatformsResponse])
def get_platforms():
    return Envelope(data=PlatformsResponse(platforms=PLATFORMS))


@router.get(
    "",
    response_model=Envelope[Paginated[ProblemResponse]],
    dependencies=[Depends(get_current_user)],
)
def list_problems(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = None,
    platform: str | None = None,
    difficulty: str | None = None,
    topic: str | None = None,
    company: str | None = None,
    list_id: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Problem)
    if q:
        query = query.filter(
            or_(Problem.title.ilike(f"%{q}%"), Problem.slug.ilike(f"%{q}%"))
        )
    if platform:
        query = query.filter(Problem.platform == platform)
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty)
    if topic:
        query = query.filter(Problem.topic_tags.any(topic))
    if company:
        query = query.filter(Problem.company_tags.any(company))
    if list_id:
        sub = db.query(ListProblem.problem_id).filter(ListProblem.list_id == list_id)
        query = query.filter(Problem.id.in_(sub))

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return Envelope(
        data=Paginated(
            items=[ProblemResponse.model_validate(p) for p in items],
            total=total,
            page=page,
            per_page=per_page,
        )
    )


@router.get(
    "/{problem_id}",
    response_model=Envelope[ProblemResponse],
    dependencies=[Depends(get_current_user)],
)
def get_problem(problem_id: str, db: Session = Depends(get_db)):
    query = db.query(Problem)
    try:
        uuid.UUID(problem_id)
    except ValueError:
        query = query.filter(Problem.slug == problem_id)
    else:
        query = query.filter(
            or_(Problem.id == problem_id, Problem.slug == problem_id)
        )
    problem = query.first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found"
        )
    return Envelope(data=ProblemResponse.model_validate(problem))
