from datetime import date

from sqlalchemy.orm import Session

from app.models.daily_time_spent import DailyTimeSpent


def record_time_spent(db: Session, user_id: str, day: date, seconds: int) -> None:
    if seconds <= 0:
        return
    row = (
        db.query(DailyTimeSpent)
        .filter(DailyTimeSpent.user_id == user_id, DailyTimeSpent.date == day)
        .first()
    )
    if row:
        row.seconds += seconds
    else:
        db.add(DailyTimeSpent(user_id=user_id, date=day, seconds=seconds))
    db.commit()
