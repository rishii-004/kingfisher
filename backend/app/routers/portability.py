from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth import get_current_user
from app.services.portability import export_user_data, import_user_data

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/export")
def export_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = export_user_data(db, str(current_user.id))
    return {"data": data, "error": None}


@router.post("/import")
def import_data(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = import_user_data(db, str(current_user.id), body)
    return {"data": result, "error": None}
