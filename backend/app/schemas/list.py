import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.problem import ProblemResponse


class ListCreate(BaseModel):
    name: str
    description: str | None = None


class ListUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ListResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    is_global: bool
    is_custom: bool
    owner_id: uuid.UUID | None
    problem_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ListDetailResponse(ListResponse):
    problems: list[ProblemResponse]


class ListProblemAdd(BaseModel):
    problem_id: str
    order: int | None = None


class ListProblemResponse(BaseModel):
    list_id: str
    problem_id: str
    order: int
