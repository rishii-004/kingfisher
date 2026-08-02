import uuid
from datetime import datetime

from pydantic import BaseModel, model_validator

from app.schemas.problem import ProblemResponse


class ListCreate(BaseModel):
    name: str
    description: str | None = None


class ListUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ListFromFilterCreate(BaseModel):
    name: str
    description: str | None = None
    # Same filter params as GET /problems — the new list is populated with
    # every problem currently matching this combination.
    q: str | None = None
    platform: str | None = None
    difficulty: str | None = None
    topic: str | None = None
    company: str | None = None

    @model_validator(mode="after")
    def _require_at_least_one_filter(self) -> "ListFromFilterCreate":
        if not any([self.q, self.platform, self.difficulty, self.topic, self.company]):
            raise ValueError("At least one filter must be applied")
        return self


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


class ProblemInList(ProblemResponse):
    order: int


class ListDetailResponse(ListResponse):
    problems: list[ProblemInList]


class ListProblemAdd(BaseModel):
    problem_id: str | None = None
    order: int | None = None

    # Inline problem creation, used when the problem being added doesn't
    # exist in the global pool yet (e.g. pasting a new LeetCode URL).
    title: str | None = None
    slug: str | None = None
    platform: str | None = None
    platform_url: str | None = None
    difficulty: str | None = None
    topic_tags: list[str] | None = None
    company_tags: list[str] | None = None

    @model_validator(mode="after")
    def _require_problem_id_or_new_problem_fields(self) -> "ListProblemAdd":
        if not self.problem_id and not (self.title and self.platform and self.difficulty):
            raise ValueError(
                "Provide either problem_id or title, platform and difficulty "
                "to create a new problem"
            )
        return self


class ListProblemResponse(BaseModel):
    list_id: str
    problem_id: str
    order: int


class ListReorderRequest(BaseModel):
    # Full new ordering for every problem currently in the list — the set
    # of ids must exactly match what's already there, just reordered.
    problem_ids: list[str]
