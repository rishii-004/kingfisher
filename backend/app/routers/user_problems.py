from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user_problem import StatusUpdate, StatusUpdateResponse, UserProblemResponse
from app.services.auth import get_current_user
from app.services.user_problem import get_user_problem as get_up_svc
from app.services.user_problem import get_user_problems as get_ups_svc
from app.services.user_problem import set_status as set_status_svc
from app.models.user import User

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
def list_user_problems(
    status: str | None = None,
    list_id: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = get_ups_svc(db, str(current_user.id), status, list_id, page, per_page)
    return {
        "data": {
            "items": [UserProblemResponse.model_validate(up) for up in items],
            "total": total,
            "page": page,
            "per_page": per_page,
        },
        "error": None,
    }


@router.get("/{problem_id}", response_model=UserProblemResponse)
def get_user_problem(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    up = get_up_svc(db, str(current_user.id), problem_id)
    return up


@router.put("/{problem_id}/status", response_model=StatusUpdateResponse)
def update_status(
    problem_id: str,
    body: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    up, log_required = set_status_svc(db, str(current_user.id), problem_id, body.status)
    return StatusUpdateResponse(
        user_problem=UserProblemResponse.model_validate(up),
        solve_log_required=log_required,
    )
