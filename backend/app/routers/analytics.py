from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.analytics import (
    get_difficulty_breakdown,
    get_heatmap_data,
    get_radar_data,
    get_time_spent_trends,
)
from app.services.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/heatmap")
def heatmap(
    year: int = Query(2026, ge=2020, le=2035),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = get_heatmap_data(db, str(current_user.id), year)
    return {"data": data, "error": None}


@router.get("/radar")
def radar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = get_radar_data(db, str(current_user.id))
    return {"data": data, "error": None}


@router.get("/difficulty")
def difficulty(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = get_difficulty_breakdown(db, str(current_user.id))
    return {"data": data, "error": None}


@router.get("/time-trends")
def time_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = get_time_spent_trends(db, str(current_user.id))
    return {"data": data, "error": None}
