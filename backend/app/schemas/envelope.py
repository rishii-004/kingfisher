from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorInfo(BaseModel):
    code: str
    message: str


class Envelope(BaseModel, Generic[T]):
    data: T | None = None
    error: ErrorInfo | None = None


class Paginated(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int
