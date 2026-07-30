from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.list import ProblemList
from app.models.list_problem import ListProblem
from app.models.problem import Problem
from app.schemas.list import ListCreate, ListResponse, ListUpdate
from app.schemas.problem import ProblemCreate, ProblemResponse, ProblemUpdate
from app.services.auth import get_admin_user
from app.models.user import User

router = APIRouter(dependencies=[Depends(get_admin_user)])


@router.post("/problems", response_model=ProblemResponse, status_code=status.HTTP_201_CREATED)
def create_problem(body: ProblemCreate, db: Session = Depends(get_db)):
    existing = db.query(Problem).filter(Problem.slug == body.slug).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Problem with this slug already exists")
    problem = Problem(**body.model_dump())
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return problem


@router.put("/problems/{problem_id}", response_model=ProblemResponse)
def update_problem(problem_id: str, body: ProblemUpdate, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(problem, key, val)
    db.commit()
    db.refresh(problem)
    return problem


@router.delete("/problems/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_problem(problem_id: str, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")
    db.delete(problem)
    db.commit()


@router.post("/lists", response_model=ListResponse, status_code=status.HTTP_201_CREATED)
def create_list(body: ListCreate, db: Session = Depends(get_db)):
    existing = db.query(ProblemList).filter(ProblemList.name == body.name, ProblemList.is_global == True).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="List with this name already exists")
    lst = ProblemList(name=body.name, description=body.description, is_global=True)
    db.add(lst)
    db.commit()
    db.refresh(lst)
    return lst


@router.put("/lists/{list_id}", response_model=ListResponse)
def update_list(list_id: str, body: ListUpdate, db: Session = Depends(get_db)):
    lst = db.query(ProblemList).filter(ProblemList.id == list_id, ProblemList.is_global == True).first()
    if not lst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(lst, key, val)
    db.commit()
    db.refresh(lst)
    return lst


@router.delete("/lists/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_list(list_id: str, db: Session = Depends(get_db)):
    lst = db.query(ProblemList).filter(ProblemList.id == list_id, ProblemList.is_global == True).first()
    if not lst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    db.delete(lst)
    db.commit()


@router.post("/lists/{list_id}/problems", status_code=status.HTTP_201_CREATED)
def add_problem_to_list(list_id: str, problem_id: str, order: int = 0, db: Session = Depends(get_db)):
    lst = db.query(ProblemList).filter(ProblemList.id == list_id, ProblemList.is_global == True).first()
    if not lst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")
    existing = db.query(ListProblem).filter(
        ListProblem.list_id == list_id, ListProblem.problem_id == problem_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Problem already in list")
    lp = ListProblem(list_id=list_id, problem_id=problem_id, order=order)
    db.add(lp)
    db.commit()
    return {"list_id": list_id, "problem_id": problem_id, "order": order}


@router.delete("/lists/{list_id}/problems/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_problem_from_list(list_id: str, problem_id: str, db: Session = Depends(get_db)):
    lp = db.query(ListProblem).filter(
        ListProblem.list_id == list_id, ListProblem.problem_id == problem_id
    ).first()
    if not lp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List or Problem not found")
    db.delete(lp)
    db.commit()
