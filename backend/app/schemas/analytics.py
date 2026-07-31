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
    easy_total: int
    medium_total: int
    hard_total: int


class TimeTrendEntry(BaseModel):
    bucket: str
    count: int


class TimeSpentDay(BaseModel):
    date: str
    day: str
    minutes: int


class WeeklyPatternEntry(BaseModel):
    day: str
    count: int


class TopicMasteryEntry(BaseModel):
    topic: str
    solved: int
    total: int
    reviews_completed: int
    mistakes: int


class CompanyMasteryEntry(BaseModel):
    company: str
    solved: int
    total: int


class MistakeBreakdownEntry(BaseModel):
    tag: str
    label: str
    count: int


class ReviewPipeline(BaseModel):
    overdue: int
    due_today: int
    due_this_week: int
    due_next_week: int
    due_later: int


class ConsistencyData(BaseModel):
    total_solved: int
    solved_this_month: int
    solved_last_7_days: int
    solved_last_30_days: int
    current_streak: int
    longest_streak: int
