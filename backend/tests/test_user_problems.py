from app.database import SessionLocal
from app.models.review import Review
from app.models.solve_log import SolveLog
from app.models.user_problem import UserProblem
from tests.conftest import auth


def _cleanup(user_id: str, problem_id: str):
    db = SessionLocal()
    db.query(Review).filter(
        Review.user_id == user_id, Review.problem_id == problem_id
    ).delete(synchronize_session=False)
    db.query(SolveLog).filter(
        SolveLog.user_id == user_id, SolveLog.problem_id == problem_id
    ).delete(synchronize_session=False)
    db.query(UserProblem).filter(
        UserProblem.user_id == user_id, UserProblem.problem_id == problem_id
    ).delete(synchronize_session=False)
    db.commit()
    db.close()


def test_single_user_problem_not_found(client, test_user, problem):
    res = client.get(f"/api/v1/user/problems/{problem['id']}", headers=auth(test_user))
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"


def test_status_and_solve_log_flow(client, test_user, problem):
    pid = problem["id"]
    uid = test_user["id"]

    res = client.put(
        f"/api/v1/user/problems/{pid}/status",
        json={"status": "solving"},
        headers=auth(test_user),
    )
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert body["data"]["user_problem"]["status"] == "solving"
    assert body["data"]["solve_log_required"] is False
    assert body["data"]["user_problem"]["problem"]["id"] == pid

    res = client.put(
        f"/api/v1/user/problems/{pid}/status",
        json={"status": "solved"},
        headers=auth(test_user),
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["solve_log_required"] is True
    assert data["user_problem"]["status"] == "solved"
    assert data["user_problem"]["solved_at"] is not None

    res = client.get(f"/api/v1/user/problems/{pid}", headers=auth(test_user))
    assert res.status_code == 200
    assert res.json()["data"]["problem"]["id"] == pid

    res = client.post(
        f"/api/v1/user/problems/{pid}/solve-log",
        json={
            "mistake_tags": ["off_by_one"],
            "notes": "two pointers",
            "time_spent": "15-30m",
        },
        headers=auth(test_user),
    )
    assert res.status_code == 201
    assert res.json()["data"]["mistake_tags"] == ["off_by_one"]

    res = client.post(
        f"/api/v1/user/problems/{pid}/solve-log", json={}, headers=auth(test_user)
    )
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "CONFLICT"

    res = client.get(f"/api/v1/user/problems/{pid}/solve-log", headers=auth(test_user))
    assert res.status_code == 200
    assert res.json()["data"]["notes"] == "two pointers"

    res = client.put(
        f"/api/v1/user/problems/{pid}/solve-log",
        json={"notes": "updated notes"},
        headers=auth(test_user),
    )
    assert res.status_code == 200
    assert res.json()["data"]["notes"] == "updated notes"

    res = client.get("/api/v1/user/problems?per_page=100", headers=auth(test_user))
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    match = next(i for i in items if i["problem_id"] == pid)
    assert match["problem"]["id"] == pid
    assert match["status"] == "solved"

    client.put(
        f"/api/v1/user/problems/{pid}/status",
        json={"status": "todo"},
        headers=auth(test_user),
    )
    res = client.post(
        f"/api/v1/user/problems/{pid}/solve-log", json={}, headers=auth(test_user)
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "BAD_REQUEST"

    _cleanup(uid, pid)


def test_status_problem_not_found(client, test_user):
    res = client.put(
        "/api/v1/user/problems/00000000-0000-0000-0000-000000000000/status",
        json={"status": "solving"},
        headers=auth(test_user),
    )
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"


def test_get_missing_solve_log(client, test_user, problem):
    res = client.get(
        f"/api/v1/user/problems/{problem['id']}/solve-log", headers=auth(test_user)
    )
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"


def test_user_problems_require_auth(client):
    assert client.get("/api/v1/user/problems").status_code == 401
