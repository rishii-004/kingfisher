from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.list import ProblemList
from app.models.user import User


def enforce_list_quota(db: Session, user: User) -> None:
    """Raise 409 if creating one more owned list would exceed the user's
    max_lists quota. Admins are always unlimited."""
    if user.is_admin:
        return
    owned = db.query(ProblemList).filter(ProblemList.owner_id == user.id).count()
    if owned >= user.max_lists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"List limit reached ({user.max_lists}). "
                "Ask an admin to raise your limit."
            ),
        )
