from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.list_problem import ListProblem
from app.models.problem import Problem
from app.models.review import Review
from app.models.solve_log import SolveLog
from app.models.user_problem import UserProblem


def get_user_problem(
    db: Session, user_id: str, problem_id: str
) -> UserProblem | None:
    return db.query(UserProblem).filter(
        UserProblem.user_id == user_id, UserProblem.problem_id == problem_id
    ).first()


def get_user_problems(
    db: Session,
    user_id: str,
    status: str | None = None,
    list_id: str | None = None,
    page: int = 1,
    per_page: int = 20,
):
    q = db.query(UserProblem).filter(UserProblem.user_id == user_id)
    if status:
        q = q.filter(UserProblem.status == status)
    if list_id:
        q = q.filter(
            UserProblem.problem_id.in_(
                db.query(ListProblem.problem_id).filter(
                    ListProblem.list_id == list_id
                )
            )
        )
    total = q.count()
    items = q.order_by(UserProblem.problem_id).offset(
        (page - 1) * per_page
    ).limit(per_page).all()
    return items, total


def set_status(
    db: Session, user_id: str, problem_id: str, new_status: str
) -> tuple[UserProblem, bool]:
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found"
        )

    up = get_user_problem(db, user_id, problem_id)
    if not up:
        up = UserProblem(user_id=user_id, problem_id=problem_id, status="todo")
        db.add(up)

    was_solved = up.status == "solved"
    up.status = new_status
    if new_status == "solved" and not was_solved:
        up.solved_at = datetime.now(timezone.utc)
    elif new_status != "solved":
        up.solved_at = None

    db.commit()
    db.refresh(up)

    solve_log_required = (new_status == "solved" and not was_solved)
    return up, solve_log_required


def reset_list_progress(db: Session, list_id: str, user_id: str) -> None:
    problem_ids = [
        row.problem_id
        for row in db.query(ListProblem).filter(ListProblem.list_id == list_id).all()
    ]
    if not problem_ids:
        return

    db.query(UserProblem).filter(
        UserProblem.user_id == user_id,
        UserProblem.problem_id.in_(problem_ids),
    ).update({"status": "todo", "solved_at": None}, synchronize_session=False)

    db.query(Review).filter(
        Review.user_id == user_id,
        Review.problem_id.in_(problem_ids),
    ).delete(synchronize_session=False)

    db.query(SolveLog).filter(
        SolveLog.user_id == user_id,
        SolveLog.problem_id.in_(problem_ids),
    ).delete(synchronize_session=False)

    db.commit()
