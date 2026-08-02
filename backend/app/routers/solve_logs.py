from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.envelope import Envelope
from app.schemas.user_problem import SolveLogCreate, SolveLogResponse, SolveLogUpdate
from app.services.auth import get_current_user
from app.services.solve_log import create_solve_log, get_solve_log, update_solve_log

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.post(
    "/{problem_id}/solve-log",
    response_model=Envelope[SolveLogResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_log(
    problem_id: str,
    body: SolveLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = create_solve_log(
        db,
        str(current_user.id),
        problem_id,
        body.mistake_tags,
        body.notes,
        body.time_spent,
    )
    return Envelope(data=SolveLogResponse.model_validate(log))


@router.put("/{problem_id}/solve-log", response_model=Envelope[SolveLogResponse])
def update_log(
    problem_id: str,
    body: SolveLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = update_solve_log(
        db,
        str(current_user.id),
        problem_id,
        body.mistake_tags,
        body.notes,
        body.time_spent,
    )
    return Envelope(data=SolveLogResponse.model_validate(log))


@router.get("/{problem_id}/solve-log", response_model=Envelope[SolveLogResponse])
def get_log(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = get_solve_log(db, str(current_user.id), problem_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Solve log not found"
        )
    return Envelope(data=SolveLogResponse.model_validate(log))
