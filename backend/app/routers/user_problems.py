from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.problem import Problem
from app.models.user import User
from app.schemas.envelope import Envelope, Paginated
from app.schemas.problem import ProblemResponse
from app.schemas.user_problem import (
    StatusUpdate,
    StatusUpdateResponse,
    UserProblemResponse,
)
from app.services.auth import get_current_user
from app.services.user_problem import get_user_problem as get_up_svc
from app.services.user_problem import get_user_problems as get_ups_svc
from app.services.user_problem import set_status as set_status_svc

router = APIRouter(dependencies=[Depends(get_current_user)])


def _to_response(db: Session, up) -> UserProblemResponse:
    problem = db.query(Problem).filter(Problem.id == up.problem_id).first()
    return UserProblemResponse(
        user_id=up.user_id,
        problem_id=up.problem_id,
        status=up.status,
        solved_at=up.solved_at,
        problem=ProblemResponse.model_validate(problem) if problem else None,
    )


@router.get("", response_model=Envelope[Paginated[UserProblemResponse]])
def list_user_problems(
    status: str | None = None,
    list_id: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = get_ups_svc(
        db, str(current_user.id), status, list_id, page, per_page
    )
    return Envelope(
        data=Paginated(
            items=[_to_response(db, up) for up in items],
            total=total,
            page=page,
            per_page=per_page,
        )
    )


@router.get("/{problem_id}", response_model=Envelope[UserProblemResponse])
def get_user_problem(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    up = get_up_svc(db, str(current_user.id), problem_id)
    if not up:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User problem not found"
        )
    return Envelope(data=_to_response(db, up))


@router.put("/{problem_id}/status", response_model=Envelope[StatusUpdateResponse])
def update_status(
    problem_id: str,
    body: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    up, log_required = set_status_svc(db, str(current_user.id), problem_id, body.status)
    return Envelope(
        data=StatusUpdateResponse(
            user_problem=_to_response(db, up),
            solve_log_required=log_required,
        )
    )
