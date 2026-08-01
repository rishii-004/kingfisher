from datetime import date

from pydantic import BaseModel, Field


class TimeSpentDelta(BaseModel):
    date: date
    # A single flush is expected to cover at most a couple minutes (the
    # client ticks every 30s); capped well above that as a sanity bound
    # against a stray client sending an inflated delta (e.g. a suspended
    # laptop waking up and computing a huge now-minus-last gap).
    seconds: int = Field(ge=0, le=300)
