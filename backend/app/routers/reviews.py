from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.problem import Problem
from app.models.review import Review
from app.models.user import User
from app.schemas.envelope import Envelope, Paginated
from app.schemas.problem import ProblemResponse
from app.schemas.review import ReviewCountResponse, ReviewResponse
from app.services.auth import get_current_user
from app.services.spaced_repetition import (
    complete_review as complete_review_svc,
)
from app.services.spaced_repetition import (
    get_due_reviews,
    get_review_count,
)

router = APIRouter(dependencies=[Depends(get_current_user)])


def _enrich_problem(db: Session, review: Review) -> ReviewResponse:
    problem = db.query(Problem).filter(Problem.id == review.problem_id).first()
    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        problem_id=review.problem_id,
        problem=ProblemResponse.model_validate(problem) if problem else None,
        interval_days=review.interval_days,
        due_at=review.due_at,
        review_stage=review.review_stage,
        last_reviewed_at=review.last_reviewed_at,
        created_at=review.created_at,
    )


@router.get("/due", response_model=Envelope[Paginated[ReviewResponse]])
def list_due_reviews(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = get_due_reviews(db, str(current_user.id), page, per_page)
    return Envelope(
        data=Paginated(
            items=[_enrich_problem(db, r) for r in items],
            total=total,
            page=page,
            per_page=per_page,
        )
    )


@router.get("/count", response_model=Envelope[ReviewCountResponse])
def due_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = get_review_count(db, str(current_user.id))
    return Envelope(data=ReviewCountResponse(count=count))


@router.post("/{review_id}/complete", response_model=Envelope[ReviewResponse])
def complete(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = complete_review_svc(db, review_id, str(current_user.id))
    return Envelope(data=_enrich_problem(db, review))
