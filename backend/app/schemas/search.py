from pydantic import BaseModel

from app.schemas.list import ListResponse
from app.schemas.problem import ProblemResponse


class NoteResult(BaseModel):
    problem_id: str
    problem_title: str
    notes_snippet: str


class SearchResultItem(BaseModel):
    type: str
    relevance: float
    data: ProblemResponse | NoteResult | ListResponse


class SearchResults(BaseModel):
    results: list[SearchResultItem]
    total: int
    page: int
    per_page: int
