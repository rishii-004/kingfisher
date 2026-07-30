from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.review import Review

INTERVALS = [7, 14, 30, 90]


def schedule_first_review(
    db: Session, user_id: str, problem_id: str, solve_log_id: str,
) -> Review:
    review = Review(
        user_id=user_id,
        problem_id=problem_id,
        solve_log_id=solve_log_id,
        interval_days=INTERVALS[0],
        due_at=datetime.now(timezone.utc) + timedelta(days=INTERVALS[0]),
        review_stage=0,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def advance_review(db: Session, review_id: str) -> Review:
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    next_stage = min(review.review_stage + 1, len(INTERVALS) - 1)
    review.review_stage = next_stage
    review.interval_days = INTERVALS[next_stage]
    review.due_at = datetime.now(timezone.utc) + timedelta(days=INTERVALS[next_stage])
    review.last_reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(review)
    return review


def get_due_reviews(
    db: Session, user_id: str, page: int = 1, per_page: int = 20,
):
    q = db.query(Review).filter(
        Review.user_id == user_id,
        Review.due_at <= datetime.now(timezone.utc),
    )
    total = q.count()
    items = q.order_by(Review.due_at).offset(
        (page - 1) * per_page
    ).limit(per_page).all()
    return items, total


def get_review_count(db: Session, user_id: str) -> int:
    return db.query(Review).filter(
        Review.user_id == user_id,
        Review.due_at <= datetime.now(timezone.utc),
    ).count()


def complete_review(db: Session, review_id: str, user_id: str) -> Review:
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if str(review.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Review does not belong to user",
        )
    return advance_review(db, review_id)
