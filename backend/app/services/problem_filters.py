from sqlalchemy import or_
from sqlalchemy.orm import Query

from app.models.problem import Problem


def apply_problem_filters(
    query: Query,
    q: str | None = None,
    platform: str | None = None,
    difficulty: str | None = None,
    topic: str | None = None,
    company: str | None = None,
) -> Query:
    if q:
        query = query.filter(
            or_(Problem.title.ilike(f"%{q}%"), Problem.slug.ilike(f"%{q}%"))
        )
    if platform:
        query = query.filter(Problem.platform == platform)
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty)
    if topic:
        query = query.filter(Problem.topic_tags.any(topic))
    if company:
        query = query.filter(Problem.company_tags.any(company))
    return query
