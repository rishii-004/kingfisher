from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.list import ProblemList
from app.models.problem import Problem
from app.models.solve_log import SolveLog


def search_problems(db: Session, query: str):
    return db.query(Problem).filter(
        or_(
            Problem.title.ilike(f"%{query}%"),
            Problem.slug.ilike(f"%{query}%"),
            Problem.topic_tags.any(query),
        )
    ).all()


def search_notes(db: Session, query: str, user_id: str):
    return db.query(SolveLog).filter(
        SolveLog.user_id == user_id,
        SolveLog.notes.ilike(f"%{query}%"),
    ).all()


def search_lists(db: Session, query: str, user_id: str):
    return db.query(ProblemList).filter(
        or_(
            ProblemList.name.ilike(f"%{query}%"),
            ProblemList.description.ilike(f"%{query}%"),
        ),
        or_(
            ProblemList.is_global.is_(True),
            ProblemList.owner_id == user_id,
        ),
    ).all()
