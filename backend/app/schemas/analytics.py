from pydantic import BaseModel


class HeatmapEntry(BaseModel):
    date: str
    count: int


class RadarEntry(BaseModel):
    topic: str
    solved: int


class DifficultyBreakdown(BaseModel):
    easy: int
    medium: int
    hard: int


class TimeTrendEntry(BaseModel):
    bucket: str
    count: int
