from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.analytics import (
    CompanyMasteryEntry,
    ConsistencyData,
    DifficultyBreakdown,
    HeatmapEntry,
    MistakeBreakdownEntry,
    RadarEntry,
    ReviewPipeline,
    TimeTrendEntry,
    TopicMasteryEntry,
    WeeklyPatternEntry,
)
from app.schemas.envelope import Envelope
from app.services.analytics import (
    get_company_mastery,
    get_consistency_data,
    get_difficulty_breakdown,
    get_heatmap_data,
    get_mistake_breakdown,
    get_radar_data,
    get_review_pipeline,
    get_time_spent_trends,
    get_topic_mastery,
    get_weekly_pattern,
)
from app.services.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/heatmap", response_model=Envelope[list[HeatmapEntry]])
def heatmap(
    year: int = Query(2026, ge=2020, le=2035),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return Envelope(data=get_heatmap_data(db, str(current_user.id), year))


@router.get("/radar", response_model=Envelope[list[RadarEntry]])
def radar(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return Envelope(data=get_radar_data(db, str(current_user.id)))


@router.get("/difficulty", response_model=Envelope[DifficultyBreakdown])
def difficulty(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return Envelope(data=get_difficulty_breakdown(db, str(current_user.id)))


@router.get("/time-trends", response_model=Envelope[list[TimeTrendEntry]])
def time_trends(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return Envelope(data=get_time_spent_trends(db, str(current_user.id)))


@router.get("/weekly-pattern", response_model=Envelope[list[WeeklyPatternEntry]])
def weekly_pattern(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return Envelope(data=get_weekly_pattern(db, str(current_user.id)))


@router.get("/topic-mastery", response_model=Envelope[list[TopicMasteryEntry]])
def topic_mastery(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return Envelope(data=get_topic_mastery(db, str(current_user.id)))


@router.get("/company", response_model=Envelope[list[CompanyMasteryEntry]])
def company_mastery(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return Envelope(data=get_company_mastery(db, str(current_user.id)))


@router.get("/mistakes", response_model=Envelope[list[MistakeBreakdownEntry]])
def mistake_breakdown(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return Envelope(data=get_mistake_breakdown(db, str(current_user.id)))


@router.get("/review-pipeline", response_model=Envelope[ReviewPipeline])
def review_pipeline(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return Envelope(data=get_review_pipeline(db, str(current_user.id)))


@router.get("/consistency", response_model=Envelope[ConsistencyData])
def consistency(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return Envelope(data=get_consistency_data(db, str(current_user.id)))
