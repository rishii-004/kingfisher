from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.solve_log import SolveLog
from app.models.user_problem import UserProblem
from app.services.spaced_repetition import schedule_first_review


def create_solve_log(
    db: Session, user_id: str, problem_id: str, mistake_tags: list[str],
    notes: str | None, time_spent: str | None,
) -> SolveLog:
    up = db.query(UserProblem).filter(
        UserProblem.user_id == user_id, UserProblem.problem_id == problem_id
    ).first()
    if not up or up.status != "solved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Problem not in solved status",
        )
    existing = db.query(SolveLog).filter(
        SolveLog.user_id == user_id, SolveLog.problem_id == problem_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Solve log already exists",
        )
    log = SolveLog(
        user_id=user_id,
        problem_id=problem_id,
        mistake_tags=mistake_tags,
        notes=notes,
        time_spent=time_spent,
        solved_at=datetime.now(timezone.utc),
    )
    db.add(log)
    db.flush()
    schedule_first_review(db, user_id, problem_id, str(log.id))
    db.commit()
    db.refresh(log)
    return log


def update_solve_log(
    db: Session, user_id: str, problem_id: str,
    mistake_tags: list[str] | None, notes: str | None, time_spent: str | None,
) -> SolveLog:
    log = db.query(SolveLog).filter(
        SolveLog.user_id == user_id, SolveLog.problem_id == problem_id
    ).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solve log not found",
        )
    if mistake_tags is not None:
        log.mistake_tags = mistake_tags
    if notes is not None:
        log.notes = notes
    if time_spent is not None:
        log.time_spent = time_spent
    db.commit()
    db.refresh(log)
    return log


def get_solve_log(db: Session, user_id: str, problem_id: str) -> SolveLog | None:
    return db.query(SolveLog).filter(
        SolveLog.user_id == user_id, SolveLog.problem_id == problem_id
    ).first()
