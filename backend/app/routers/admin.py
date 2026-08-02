from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.list import ProblemList
from app.models.list_problem import ListProblem
from app.models.problem import Problem
from app.models.review import Review
from app.models.solve_log import SolveLog
from app.models.user import User
from app.models.user_problem import UserProblem
from app.schemas.auth import MaxListsUpdate, UserResponse
from app.schemas.envelope import Envelope, Paginated
from app.schemas.list import (
    ListCreate,
    ListProblemAdd,
    ListProblemResponse,
    ListResponse,
    ListUpdate,
)
from app.schemas.problem import ProblemCreate, ProblemResponse, ProblemUpdate
from app.services.auth import get_admin_user

router = APIRouter(dependencies=[Depends(get_admin_user)])


@router.get("/problems", response_model=Envelope[Paginated[ProblemResponse]])
def list_all_problems(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Problem)
    if q:
        query = query.filter(
            or_(Problem.title.ilike(f"%{q}%"), Problem.slug.ilike(f"%{q}%"))
        )
    query = query.order_by(Problem.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return Envelope(
        data=Paginated(
            items=[ProblemResponse.model_validate(p) for p in items],
            total=total,
            page=page,
            per_page=per_page,
        )
    )


@router.post(
    "/problems",
    response_model=Envelope[ProblemResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_problem(body: ProblemCreate, db: Session = Depends(get_db)):
    existing = db.query(Problem).filter(Problem.slug == body.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Problem with this slug already exists",
        )
    problem = Problem(**body.model_dump())
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return Envelope(data=ProblemResponse.model_validate(problem))


@router.put("/problems/{problem_id}", response_model=Envelope[ProblemResponse])
def update_problem(problem_id: str, body: ProblemUpdate, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found"
        )
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(problem, key, val)
    db.commit()
    db.refresh(problem)
    return Envelope(data=ProblemResponse.model_validate(problem))


@router.delete("/problems/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_problem(problem_id: str, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found"
        )
    db.delete(problem)
    db.commit()


def _list_to_response(lst: ProblemList, db: Session) -> ListResponse:
    problem_count = db.query(ListProblem).filter(
        ListProblem.list_id == lst.id
    ).count()
    return ListResponse(
        id=lst.id,
        name=lst.name,
        description=lst.description,
        is_global=lst.is_global,
        is_custom=lst.is_custom,
        owner_id=lst.owner_id,
        problem_count=problem_count,
        created_at=lst.created_at,
        updated_at=lst.updated_at,
    )


@router.get("/lists", response_model=Envelope[Paginated[ListResponse]])
def list_all_global_lists(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(ProblemList).filter(ProblemList.is_global == True)
    query = query.order_by(ProblemList.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return Envelope(
        data=Paginated(
            items=[_list_to_response(lst, db) for lst in items],
            total=total,
            page=page,
            per_page=per_page,
        )
    )


@router.post(
    "/lists", response_model=Envelope[ListResponse], status_code=status.HTTP_201_CREATED
)
def create_list(body: ListCreate, db: Session = Depends(get_db)):
    existing = db.query(ProblemList).filter(
        ProblemList.name == body.name, ProblemList.is_global == True
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="List with this name already exists",
        )
    lst = ProblemList(name=body.name, description=body.description, is_global=True)
    db.add(lst)
    db.commit()
    db.refresh(lst)
    return Envelope(data=_list_to_response(lst, db))


@router.put("/lists/{list_id}", response_model=Envelope[ListResponse])
def update_list(list_id: str, body: ListUpdate, db: Session = Depends(get_db)):
    lst = db.query(ProblemList).filter(
        ProblemList.id == list_id, ProblemList.is_global == True
    ).first()
    if not lst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(lst, key, val)
    db.commit()
    db.refresh(lst)
    return Envelope(data=_list_to_response(lst, db))


@router.delete("/lists/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_list(list_id: str, db: Session = Depends(get_db)):
    lst = db.query(ProblemList).filter(
        ProblemList.id == list_id, ProblemList.is_global == True
    ).first()
    if not lst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )
    db.query(ListProblem).filter(ListProblem.list_id == list_id).delete(
        synchronize_session=False
    )
    db.delete(lst)
    db.commit()


@router.post(
    "/lists/{list_id}/problems",
    response_model=Envelope[ListProblemResponse],
    status_code=status.HTTP_201_CREATED,
)
def add_problem_to_list(
    list_id: str, body: ListProblemAdd, db: Session = Depends(get_db)
):
    lst = db.query(ProblemList).filter(
        ProblemList.id == list_id, ProblemList.is_global == True
    ).first()
    if not lst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )
    problem = db.query(Problem).filter(Problem.id == body.problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found"
        )
    existing = db.query(ListProblem).filter(
        ListProblem.list_id == list_id, ListProblem.problem_id == body.problem_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Problem already in list"
        )
    order = body.order
    if order is None:
        max_order = (
            db.query(ListProblem.order)
            .filter(ListProblem.list_id == list_id)
            .order_by(ListProblem.order.desc())
            .first()
        )
        order = (max_order[0] or 0) + 1 if max_order else 0
    lp = ListProblem(list_id=list_id, problem_id=body.problem_id, order=order)
    db.add(lp)
    db.commit()
    return Envelope(
        data=ListProblemResponse(
            list_id=str(list_id), problem_id=str(body.problem_id), order=order
        )
    )


@router.delete(
    "/lists/{list_id}/problems/{problem_id}", status_code=status.HTTP_204_NO_CONTENT
)
def remove_problem_from_list(list_id: str, problem_id: str, db: Session = Depends(get_db)):
    lp = db.query(ListProblem).filter(
        ListProblem.list_id == list_id, ListProblem.problem_id == problem_id
    ).first()
    if not lp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List or Problem not found"
        )
    db.delete(lp)
    db.commit()


@router.get("/users", response_model=Envelope[Paginated[UserResponse]])
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if q:
        query = query.filter(
            or_(User.username.ilike(f"%{q}%"), User.email.ilike(f"%{q}%"))
        )
    query = query.order_by(User.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return Envelope(
        data=Paginated(
            items=[UserResponse.model_validate(u) for u in items],
            total=total,
            page=page,
            per_page=per_page,
        )
    )


@router.patch("/users/{user_id}/toggle-admin", response_model=Envelope[UserResponse])
def toggle_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot toggle your own admin status",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    user.is_admin = not user.is_admin
    db.commit()
    db.refresh(user)
    return Envelope(data=UserResponse.model_validate(user))


@router.patch("/users/{user_id}/max-lists", response_model=Envelope[UserResponse])
def update_max_lists(
    user_id: str,
    body: MaxListsUpdate,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    user.max_lists = body.max_lists
    db.commit()
    db.refresh(user)
    return Envelope(data=UserResponse.model_validate(user))


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete yourself"
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    owned_list_ids = [
        row.id
        for row in db.query(ProblemList.id).filter(
            ProblemList.owner_id == user_id
        ).all()
    ]
    if owned_list_ids:
        db.query(ListProblem).filter(
            ListProblem.list_id.in_(owned_list_ids)
        ).delete(synchronize_session=False)
        db.query(ProblemList).filter(
            ProblemList.id.in_(owned_list_ids)
        ).delete(synchronize_session=False)
    db.query(Review).filter(Review.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(SolveLog).filter(SolveLog.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(UserProblem).filter(UserProblem.user_id == user_id).delete(
        synchronize_session=False
    )
    db.delete(user)
    db.commit()
