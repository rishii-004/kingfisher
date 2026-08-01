from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.time_spent import TimeSpentDelta
from app.services.auth import get_current_user
from app.services.time_spent import record_time_spent

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
def post_time_spent(
    body: TimeSpentDelta,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record_time_spent(db, str(current_user.id), body.date, body.seconds)
