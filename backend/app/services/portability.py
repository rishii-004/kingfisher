from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.list import ProblemList
from app.models.list_problem import ListProblem
from app.models.problem import Problem
from app.models.review import Review
from app.models.solve_log import SolveLog
from app.models.user import User
from app.models.user_problem import UserProblem


def export_user_data(db: Session, user_id: str) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user_problems = db.query(UserProblem).filter(
        UserProblem.user_id == user_id
    ).all()

    solve_logs = db.query(SolveLog).filter(
        SolveLog.user_id == user_id
    ).all()

    reviews = db.query(Review).filter(
        Review.user_id == user_id
    ).all()

    custom_lists = db.query(ProblemList).filter(
        ProblemList.owner_id == user_id,
        ProblemList.is_custom.is_(True),
    ).all()

    custom_list_data = []
    for lst in custom_lists:
        rows = (
            db.query(Problem, ListProblem.order)
            .join(ListProblem, Problem.id == ListProblem.problem_id)
            .filter(ListProblem.list_id == lst.id)
            .order_by(ListProblem.order)
            .all()
        )
        custom_list_data.append({
            "id": str(lst.id),
            "name": lst.name,
            "description": lst.description,
            "is_global": lst.is_global,
            "is_custom": lst.is_custom,
            "owner_id": str(lst.owner_id) if lst.owner_id else None,
            "problem_count": len(rows),
            "created_at": lst.created_at.isoformat(),
            "updated_at": lst.updated_at.isoformat(),
            "problems": [
                {
                    "id": str(p.id),
                    "title": p.title,
                    "slug": p.slug,
                    "platform": p.platform,
                    "platform_url": p.platform_url,
                    "difficulty": p.difficulty,
                    "topic_tags": p.topic_tags,
                    "company_tags": p.company_tags,
                    "created_at": p.created_at.isoformat(),
                    "updated_at": p.updated_at.isoformat(),
                    "order": order,
                }
                for p, order in rows
            ],
        })

    return {
        "export_version": "1.0",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "is_admin": user.is_admin,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        },
        "user_problems": [
            {
                "user_id": str(up.user_id),
                "problem_id": str(up.problem_id),
                "status": up.status,
                "solved_at": up.solved_at.isoformat() if up.solved_at else None,
            }
            for up in user_problems
        ],
        "solve_logs": [
            {
                "id": str(sl.id),
                "user_id": str(sl.user_id),
                "problem_id": str(sl.problem_id),
                "mistake_tags": sl.mistake_tags,
                "notes": sl.notes,
                "time_spent": sl.time_spent,
                "solved_at": sl.solved_at.isoformat(),
            }
            for sl in solve_logs
        ],
        "reviews": [
            {
                "id": str(r.id),
                "user_id": str(r.user_id),
                "problem_id": str(r.problem_id),
                "solve_log_id": str(r.solve_log_id) if r.solve_log_id else None,
                "interval_days": r.interval_days,
                "due_at": r.due_at.isoformat(),
                "review_stage": r.review_stage,
                "last_reviewed_at": r.last_reviewed_at.isoformat() if r.last_reviewed_at else None,
                "created_at": r.created_at.isoformat(),
            }
            for r in reviews
        ],
        "custom_lists": custom_list_data,
    }


def import_user_data(db: Session, user_id: str, data: dict) -> dict:
    counts = {
        "user_problems": 0,
        "solve_logs": 0,
        "reviews": 0,
        "custom_lists": 0,
    }
    errors = []

    if data.get("export_version") != "1.0":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported export version",
        )

    if "user_problems" in data:
        for item in data["user_problems"]:
            try:
                with db.begin_nested():
                    existing = db.query(UserProblem).filter(
                        UserProblem.user_id == user_id,
                        UserProblem.problem_id == item["problem_id"],
                    ).first()
                    if existing:
                        existing.status = item.get("status", existing.status)
                        if item.get("solved_at"):
                            existing.solved_at = datetime.fromisoformat(item["solved_at"])
                    else:
                        up = UserProblem(
                            user_id=user_id,
                            problem_id=item["problem_id"],
                            status=item.get("status", "todo"),
                            solved_at=datetime.fromisoformat(item["solved_at"]) if item.get("solved_at") else None,
                        )
                        db.add(up)
                    db.flush()
                counts["user_problems"] += 1
            except Exception as e:
                errors.append({"item": item, "error": str(e)})

    if "solve_logs" in data:
        for item in data["solve_logs"]:
            try:
                with db.begin_nested():
                    existing = db.query(SolveLog).filter(
                        SolveLog.id == item["id"],
                    ).first()
                    if existing:
                        existing.mistake_tags = item.get("mistake_tags", existing.mistake_tags)
                        existing.notes = item.get("notes", existing.notes)
                        existing.time_spent = item.get("time_spent", existing.time_spent)
                    else:
                        sl = SolveLog(
                            id=item["id"],
                            user_id=user_id,
                            problem_id=item["problem_id"],
                            mistake_tags=item.get("mistake_tags"),
                            notes=item.get("notes"),
                            time_spent=item.get("time_spent"),
                            solved_at=datetime.fromisoformat(item["solved_at"]) if item.get("solved_at") else datetime.now(timezone.utc),
                        )
                        db.add(sl)
                    db.flush()
                counts["solve_logs"] += 1
            except Exception as e:
                errors.append({"item": item, "error": str(e)})

    if "reviews" in data:
        for item in data["reviews"]:
            try:
                with db.begin_nested():
                    existing = db.query(Review).filter(
                        Review.id == item["id"],
                    ).first()
                    if existing:
                        existing.interval_days = item.get("interval_days", existing.interval_days)
                        existing.review_stage = item.get("review_stage", existing.review_stage)
                        if item.get("due_at"):
                            existing.due_at = datetime.fromisoformat(item["due_at"])
                    else:
                        r = Review(
                            id=item["id"],
                            user_id=user_id,
                            problem_id=item["problem_id"],
                            solve_log_id=item.get("solve_log_id"),
                            interval_days=item.get("interval_days", 7),
                            due_at=datetime.fromisoformat(item["due_at"]) if item.get("due_at") else datetime.now(timezone.utc),
                            review_stage=item.get("review_stage", 0),
                            last_reviewed_at=datetime.fromisoformat(item["last_reviewed_at"]) if item.get("last_reviewed_at") else None,
                        )
                        db.add(r)
                    db.flush()
                counts["reviews"] += 1
            except Exception as e:
                errors.append({"item": item, "error": str(e)})

    if "custom_lists" in data:
        for item in data["custom_lists"]:
            try:
                with db.begin_nested():
                    existing = db.query(ProblemList).filter(
                        ProblemList.id == item["id"],
                    ).first()
                    if existing:
                        existing.name = item.get("name", existing.name)
                        existing.description = item.get("description", existing.description)
                    else:
                        lst = ProblemList(
                            id=item["id"],
                            name=item["name"],
                            description=item.get("description"),
                            is_global=False,
                            is_custom=True,
                            owner_id=user_id,
                        )
                        db.add(lst)
                        db.flush()

                    if "problems" in item:
                        for p_item in item["problems"]:
                            lp = db.query(ListProblem).filter(
                                ListProblem.list_id == item["id"],
                                ListProblem.problem_id == p_item["id"],
                            ).first()
                            if not lp:
                                db.add(ListProblem(
                                    list_id=item["id"],
                                    problem_id=p_item["id"],
                                    order=p_item.get("order", 0),
                                ))
                    db.flush()
                counts["custom_lists"] += 1
            except Exception as e:
                errors.append({"item": item, "error": str(e)})

    db.commit()
    return {"imported": counts, "errors": errors}
