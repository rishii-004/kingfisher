import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.problem import ProblemResponse


class ReviewResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    problem_id: uuid.UUID
    problem: ProblemResponse | None = None
    interval_days: int
    due_at: datetime
    review_stage: int
    last_reviewed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewCountResponse(BaseModel):
    count: int
