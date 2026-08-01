import uuid
from datetime import date as date_type
from datetime import datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DailyTimeSpent(Base):
    __tablename__ = "daily_time_spent"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_daily_time_spent_user_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    # The client's own local date (not UTC) — this is meant to match what
    # the user perceives as "today", same as the client-side tracker it's
    # fed by.
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
