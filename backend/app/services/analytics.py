from collections import defaultdict
from datetime import date as date_type
from datetime import datetime, time, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.daily_time_spent import DailyTimeSpent
from app.models.problem import Problem
from app.models.review import Review
from app.models.solve_log import SolveLog
from app.models.user_problem import UserProblem

WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

MISTAKE_LABELS = {
    "edge_case_missed": "Edge case missed",
    "off_by_one": "Off-by-one",
    "tle": "Time limit exceeded",
    "wrong_approach": "Wrong approach",
    "syntax_error": "Syntax error",
    "didnt_know_pattern": "Didn't know pattern",
    "mle": "Memory limit exceeded",
    "other": "Other",
}


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
        .all()
    )
    counts = {str(row.date): row.count for row in rows}

    result = []
    day = start.date()
    end_date = end.date()
    while day < end_date:
        key = day.isoformat()
        result.append({"date": key, "count": counts.get(key, 0)})
        day += timedelta(days=1)
    return result


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
    solved_rows = (
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
    total_rows = (
        db.query(Problem.difficulty, func.count(Problem.id).label("count"))
        .group_by(Problem.difficulty)
        .all()
    )

    breakdown = {
        "easy": 0,
        "medium": 0,
        "hard": 0,
        "easy_total": 0,
        "medium_total": 0,
        "hard_total": 0,
    }
    for row in solved_rows:
        breakdown[row.difficulty] = row.count
    for row in total_rows:
        breakdown[f"{row.difficulty}_total"] = row.count
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


def get_time_spent_week(db: Session, user_id: str, today: date_type | None = None):
    # `today` is the client's own local date (see app/routers/time_spent.py) —
    # this data is keyed by local day, so the 7-day window should be too,
    # rather than drifting by a day around UTC midnight for non-UTC users.
    if today is None:
        today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=6)

    rows = (
        db.query(DailyTimeSpent.date, DailyTimeSpent.seconds)
        .filter(DailyTimeSpent.user_id == user_id, DailyTimeSpent.date >= start_date)
        .all()
    )
    minutes_by_date = {str(row.date): round(row.seconds / 60) for row in rows}

    result = []
    for i in range(7):
        d = start_date + timedelta(days=i)
        key = d.isoformat()
        result.append(
            {"date": key, "day": d.strftime("%a"), "minutes": minutes_by_date.get(key, 0)}
        )
    return result


def get_weekly_pattern(db: Session, user_id: str):
    rows = db.query(SolveLog.solved_at).filter(SolveLog.user_id == user_id).all()
    counts = dict.fromkeys(WEEKDAYS, 0)
    for row in rows:
        counts[WEEKDAYS[row.solved_at.weekday()]] += 1
    return [{"day": d, "count": counts[d]} for d in WEEKDAYS]


def get_topic_mastery(db: Session, user_id: str):
    problems = db.query(Problem.id, Problem.topic_tags).all()
    topic_to_problems = defaultdict(set)
    for p in problems:
        for topic in p.topic_tags or []:
            topic_to_problems[topic].add(p.id)

    solved_ids = {
        row.problem_id
        for row in db.query(UserProblem.problem_id).filter(
            UserProblem.user_id == user_id, UserProblem.status == "solved"
        ).all()
    }
    reviewed_ids = {
        row.problem_id
        for row in db.query(Review.problem_id).filter(
            Review.user_id == user_id, Review.review_stage > 0
        ).all()
    }
    mistakes_by_problem = defaultdict(int)
    for row in db.query(SolveLog.problem_id, SolveLog.mistake_tags).filter(
        SolveLog.user_id == user_id
    ).all():
        mistakes_by_problem[row.problem_id] += len(row.mistake_tags or [])

    result = []
    for topic, problem_ids in topic_to_problems.items():
        result.append({
            "topic": topic,
            "solved": len(problem_ids & solved_ids),
            "total": len(problem_ids),
            "reviews_completed": len(problem_ids & reviewed_ids),
            "mistakes": sum(mistakes_by_problem.get(pid, 0) for pid in problem_ids),
        })
    result.sort(key=lambda r: r["total"], reverse=True)
    return result


def get_company_mastery(db: Session, user_id: str):
    problems = db.query(Problem.id, Problem.company_tags).all()
    company_to_problems = defaultdict(set)
    for p in problems:
        for company in p.company_tags or []:
            company_to_problems[company].add(p.id)

    solved_ids = {
        row.problem_id
        for row in db.query(UserProblem.problem_id).filter(
            UserProblem.user_id == user_id, UserProblem.status == "solved"
        ).all()
    }

    result = [
        {
            "company": company,
            "solved": len(problem_ids & solved_ids),
            "total": len(problem_ids),
        }
        for company, problem_ids in company_to_problems.items()
    ]
    result.sort(key=lambda r: r["total"], reverse=True)
    return result


def get_mistake_breakdown(db: Session, user_id: str):
    counts = dict.fromkeys(MISTAKE_LABELS, 0)
    for row in db.query(SolveLog.mistake_tags).filter(
        SolveLog.user_id == user_id
    ).all():
        for tag in row.mistake_tags or []:
            if tag in counts:
                counts[tag] += 1
    result = [
        {"tag": tag, "label": MISTAKE_LABELS[tag], "count": count}
        for tag, count in counts.items()
    ]
    result.sort(key=lambda r: r["count"], reverse=True)
    return result


def get_review_pipeline(db: Session, user_id: str):
    now = datetime.now(timezone.utc)
    today = now.date()
    start_of_today = datetime.combine(today, time.min, tzinfo=timezone.utc)
    start_of_tomorrow = start_of_today + timedelta(days=1)
    start_of_this_week = start_of_today - timedelta(days=today.weekday())
    start_of_next_week = start_of_this_week + timedelta(days=7)
    start_of_week_after = start_of_next_week + timedelta(days=7)

    pipeline = {
        "overdue": 0,
        "due_today": 0,
        "due_this_week": 0,
        "due_next_week": 0,
        "due_later": 0,
    }
    due_dates = [
        row.due_at
        for row in db.query(Review.due_at).filter(Review.user_id == user_id).all()
    ]
    for due_at in due_dates:
        if due_at < start_of_today:
            pipeline["overdue"] += 1
        elif due_at < start_of_tomorrow:
            pipeline["due_today"] += 1
        elif due_at < start_of_next_week:
            pipeline["due_this_week"] += 1
        elif due_at < start_of_week_after:
            pipeline["due_next_week"] += 1
        else:
            pipeline["due_later"] += 1
    return pipeline


def get_consistency_data(db: Session, user_id: str):
    now = datetime.now(timezone.utc)
    today = now.date()
    start_of_month = datetime.combine(today.replace(day=1), time.min, tzinfo=timezone.utc)

    solved_ats = [
        row.solved_at
        for row in db.query(UserProblem.solved_at).filter(
            UserProblem.user_id == user_id,
            UserProblem.status == "solved",
            UserProblem.solved_at.isnot(None),
        ).all()
    ]

    total_solved = len(solved_ats)
    solved_this_month = sum(1 for d in solved_ats if d >= start_of_month)
    solved_last_7_days = sum(1 for d in solved_ats if d >= now - timedelta(days=7))
    solved_last_30_days = sum(1 for d in solved_ats if d >= now - timedelta(days=30))

    dates = sorted({d.date() for d in solved_ats})
    longest_streak = 0
    current_run = 0
    prev = None
    for d in dates:
        if prev is not None and d == prev + timedelta(days=1):
            current_run += 1
        else:
            current_run = 1
        longest_streak = max(longest_streak, current_run)
        prev = d

    date_set = set(dates)
    if today in date_set:
        streak_end = today
    elif (today - timedelta(days=1)) in date_set:
        streak_end = today - timedelta(days=1)
    else:
        streak_end = None

    current_streak = 0
    if streak_end:
        d = streak_end
        while d in date_set:
            current_streak += 1
            d -= timedelta(days=1)

    return {
        "total_solved": total_solved,
        "solved_this_month": solved_this_month,
        "solved_last_7_days": solved_last_7_days,
        "solved_last_30_days": solved_last_30_days,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
    }
