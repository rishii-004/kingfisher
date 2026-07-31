from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.list import ProblemList
from app.models.list_problem import ListProblem
from app.models.problem import Problem
from app.models.user import User
from app.schemas.envelope import Envelope, Paginated
from app.schemas.list import (
    ListCreate,
    ListDetailResponse,
    ListProblemAdd,
    ListProblemResponse,
    ListResponse,
    ListUpdate,
    ProblemInList,
)
from app.schemas.problem import ProblemResponse
from app.services.auth import get_current_user
from app.services.user_problem import reset_list_progress

router = APIRouter(dependencies=[Depends(get_current_user)])


def _list_to_response(lst: ProblemList, db: Session) -> ListResponse:
    count = db.query(ListProblem).filter(ListProblem.list_id == lst.id).count()
    return ListResponse(
        id=str(lst.id),
        name=lst.name,
        description=lst.description,
        is_global=lst.is_global,
        is_custom=lst.is_custom,
        owner_id=str(lst.owner_id) if lst.owner_id else None,
        problem_count=count,
        created_at=lst.created_at,
        updated_at=lst.updated_at,
    )


@router.get("", response_model=Envelope[Paginated[ListResponse]])
def list_lists(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    type: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ProblemList).filter(
        (ProblemList.is_global == True) | (ProblemList.owner_id == current_user.id)
    )
    if type == "global":
        q = q.filter(ProblemList.is_global == True)
    elif type == "custom":
        q = q.filter(ProblemList.owner_id == current_user.id)
    q = q.order_by(ProblemList.created_at.desc())
    total = q.count()
    lists = q.offset((page - 1) * per_page).limit(per_page).all()
    return Envelope(
        data=Paginated(
            items=[_list_to_response(lst, db) for lst in lists],
            total=total,
            page=page,
            per_page=per_page,
        )
    )


@router.get("/{list_id}", response_model=Envelope[ListDetailResponse])
def get_list(
    list_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lst = db.query(ProblemList).filter(ProblemList.id == list_id).first()
    if not lst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )
    if not lst.is_global and lst.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )
    lps = (
        db.query(ListProblem)
        .filter(ListProblem.list_id == lst.id)
        .order_by(ListProblem.order)
        .all()
    )
    problems = []
    for lp in lps:
        p = db.query(Problem).filter(Problem.id == lp.problem_id).first()
        if p:
            problems.append(
                ProblemInList(
                    **ProblemResponse.model_validate(p).model_dump(), order=lp.order
                )
            )
    base = _list_to_response(lst, db)
    return Envelope(data=ListDetailResponse(**base.model_dump(), problems=problems))


@router.post(
    "", response_model=Envelope[ListResponse], status_code=status.HTTP_201_CREATED
)
def create_list(
    body: ListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lst = ProblemList(
        name=body.name,
        description=body.description,
        is_custom=True,
        owner_id=current_user.id,
    )
    db.add(lst)
    db.commit()
    db.refresh(lst)
    return Envelope(data=_list_to_response(lst, db))


@router.put("/{list_id}", response_model=Envelope[ListResponse])
def update_list(
    list_id: str,
    body: ListUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lst = (
        db.query(ProblemList)
        .filter(ProblemList.id == list_id, ProblemList.owner_id == current_user.id)
        .first()
    )
    if not lst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(lst, key, val)
    db.commit()
    db.refresh(lst)
    return Envelope(data=_list_to_response(lst, db))


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_list(
    list_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lst = (
        db.query(ProblemList)
        .filter(ProblemList.id == list_id, ProblemList.owner_id == current_user.id)
        .first()
    )
    if not lst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )
    db.query(ListProblem).filter(ListProblem.list_id == list_id).delete(
        synchronize_session=False
    )
    db.delete(lst)
    db.commit()


@router.post("/{list_id}/reset", status_code=status.HTTP_204_NO_CONTENT)
def reset_list(
    list_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lst = db.query(ProblemList).filter(ProblemList.id == list_id).first()
    if not lst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )
    if not lst.is_global and lst.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )
    reset_list_progress(db, list_id, str(current_user.id))


@router.post(
    "/{list_id}/fork",
    response_model=Envelope[ListResponse],
    status_code=status.HTTP_201_CREATED,
)
def fork_list(
    list_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    original = (
        db.query(ProblemList)
        .filter(ProblemList.id == list_id, ProblemList.is_global == True)
        .first()
    )
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Global list not found"
        )
    existing = (
        db.query(ProblemList)
        .filter(
            ProblemList.owner_id == current_user.id,
            ProblemList.name == original.name,
            ProblemList.is_custom == True,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Already forked this list"
        )
    forked = ProblemList(
        name=original.name,
        description=original.description,
        is_custom=True,
        owner_id=current_user.id,
    )
    db.add(forked)
    db.flush()
    original_problems = (
        db.query(ListProblem).filter(ListProblem.list_id == original.id).all()
    )
    for lp in original_problems:
        db.add(ListProblem(list_id=forked.id, problem_id=lp.problem_id, order=lp.order))
    db.commit()
    db.refresh(forked)
    return Envelope(data=_list_to_response(forked, db))


@router.post(
    "/{list_id}/problems",
    response_model=Envelope[ListProblemResponse],
    status_code=status.HTTP_201_CREATED,
)
def add_problem_to_list(
    list_id: str,
    body: ListProblemAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lst = (
        db.query(ProblemList)
        .filter(ProblemList.id == list_id, ProblemList.owner_id == current_user.id)
        .first()
    )
    if not lst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )
    problem = db.query(Problem).filter(Problem.id == body.problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found"
        )
    existing = (
        db.query(ListProblem)
        .filter(
            ListProblem.list_id == list_id, ListProblem.problem_id == body.problem_id
        )
        .first()
    )
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
    "/{list_id}/problems/{problem_id}", status_code=status.HTTP_204_NO_CONTENT
)
def remove_problem_from_list(
    list_id: str,
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lst = (
        db.query(ProblemList)
        .filter(ProblemList.id == list_id, ProblemList.owner_id == current_user.id)
        .first()
    )
    if not lst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )
    lp = (
        db.query(ListProblem)
        .filter(ListProblem.list_id == list_id, ListProblem.problem_id == problem_id)
        .first()
    )
    if not lp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Problem not in list"
        )
    db.delete(lp)
    db.commit()
