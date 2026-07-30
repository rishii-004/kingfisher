import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.problem import ProblemResponse


class StatusUpdate(BaseModel):
    status: str  # "todo" | "solving" | "solved" | "skipped"


class UserProblemResponse(BaseModel):
    user_id: uuid.UUID
    problem_id: uuid.UUID
    status: str
    solved_at: datetime | None
    problem: ProblemResponse | None = None

    model_config = {"from_attributes": True}


class StatusUpdateResponse(BaseModel):
    user_problem: UserProblemResponse
    solve_log_required: bool = False


class SolveLogCreate(BaseModel):
    mistake_tags: list[str] = []
    notes: str | None = None
    time_spent: str | None = None  # "<15m" | "15-30m" | "30-60m" | "1h+"


class SolveLogUpdate(BaseModel):
    mistake_tags: list[str] | None = None
    notes: str | None = None
    time_spent: str | None = None


class SolveLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    problem_id: uuid.UUID
    mistake_tags: list[str] | None
    notes: str | None
    time_spent: str | None
    solved_at: datetime

    model_config = {"from_attributes": True}
