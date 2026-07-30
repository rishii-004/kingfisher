from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.problem import Problem
from app.models.solve_log import SolveLog
from app.models.user_problem import UserProblem


def get_heatmap_data(db: Session, user_id: str, year: int):
    start = datetime(year, 1, 1, tzinfo=timezone.utc)
    end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)

    rows = (
        db.query(
            func.date(SolveLog.solved_at).label("date"),
            func.count(SolveLog.id).label("count"),
        )
        .filter(
            SolveLog.user_id == user_id,
            SolveLog.solved_at >= start,
            SolveLog.solved_at < end,
        )
        .group_by(func.date(SolveLog.solved_at))
        .order_by(func.date(SolveLog.solved_at))
        .all()
    )

    return [{"date": str(row.date), "count": row.count} for row in rows]


def get_radar_data(db: Session, user_id: str):
    rows = (
        db.query(
            func.unnest(Problem.topic_tags).label("topic"),
            func.count(UserProblem.problem_id).label("solved"),
        )
        .join(Problem, UserProblem.problem_id == Problem.id)
        .filter(
            UserProblem.user_id == user_id,
            UserProblem.status == "solved",
        )
        .group_by(func.unnest(Problem.topic_tags))
        .order_by(func.count(UserProblem.problem_id).desc())
        .all()
    )

    return [{"topic": row.topic, "solved": row.solved} for row in rows]


def get_difficulty_breakdown(db: Session, user_id: str):
    rows = (
        db.query(
            Problem.difficulty,
            func.count(UserProblem.problem_id).label("count"),
        )
        .join(Problem, UserProblem.problem_id == Problem.id)
        .filter(
            UserProblem.user_id == user_id,
            UserProblem.status == "solved",
        )
        .group_by(Problem.difficulty)
        .all()
    )

    breakdown = {"easy": 0, "medium": 0, "hard": 0}
    for row in rows:
        breakdown[row.difficulty] = row.count
    return breakdown


def get_time_spent_trends(db: Session, user_id: str):
    rows = (
        db.query(
            SolveLog.time_spent,
            func.count(SolveLog.id).label("count"),
        )
        .filter(SolveLog.user_id == user_id)
        .group_by(SolveLog.time_spent)
        .order_by(SolveLog.time_spent)
        .all()
    )

    buckets = {"<15m": 0, "15-30m": 0, "30-60m": 0, "1h+": 0}
    for row in rows:
        if row.time_spent in buckets:
            buckets[row.time_spent] = row.count
    return [{"bucket": k, "count": v} for k, v in buckets.items()]
