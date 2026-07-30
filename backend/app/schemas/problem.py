import uuid
from datetime import datetime

from pydantic import BaseModel


class ProblemCreate(BaseModel):
    title: str
    slug: str
    platform: str
    platform_url: str | None = None
    difficulty: str
    topic_tags: list[str] | None = None
    company_tags: list[str] | None = None


class ProblemUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    platform: str | None = None
    platform_url: str | None = None
    difficulty: str | None = None
    topic_tags: list[str] | None = None
    company_tags: list[str] | None = None


class ProblemResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    platform: str
    platform_url: str | None
    difficulty: str
    topic_tags: list[str] | None
    company_tags: list[str] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlatformInfo(BaseModel):
    value: str
    label: str
    logo_url: str | None


class PlatformsResponse(BaseModel):
    platforms: list[PlatformInfo]
