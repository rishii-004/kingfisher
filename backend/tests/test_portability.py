import uuid

from app.database import SessionLocal
from app.models.user_problem import UserProblem
from tests.conftest import auth


def test_export_shape(client, test_user):
    res = client.get("/api/v1/user/export", headers=auth(test_user))
    assert res.status_code == 200
    body = res.json()["data"]
    assert body["export_version"] == "1.0"
    assert body["user"]["id"] == test_user["id"]
    assert "updated_at" in body["user"]
    for key in ["user_problems", "solve_logs", "reviews", "custom_lists"]:
        assert key in body


def test_export_includes_list_order_and_count(client, test_user, problem):
    res = client.post(
        "/api/v1/lists",
        json={"name": f"Export List {uuid.uuid4().hex[:6]}"},
        headers=auth(test_user),
    )
    lid = res.json()["data"]["id"]
    client.post(
        f"/api/v1/lists/{lid}/problems",
        json={"problem_id": problem["id"]},
        headers=auth(test_user),
    )

    res = client.get("/api/v1/user/export", headers=auth(test_user))
    lst = next(l for l in res.json()["data"]["custom_lists"] if l["id"] == lid)
    assert lst["problem_count"] == 1
    assert lst["problems"][0]["order"] == 0

    client.delete(f"/api/v1/lists/{lid}/problems/{problem['id']}", headers=auth(test_user))
    client.delete(f"/api/v1/lists/{lid}", headers=auth(test_user))


def test_import_invalid_version(client, test_user):
    res = client.post(
        "/api/v1/user/import",
        json={"export_version": "0.1"},
        headers=auth(test_user),
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "BAD_REQUEST"


def test_import_isolates_bad_items(client, test_user, problem):
    good_and_bad = {
        "export_version": "1.0",
        "user_problems": [
            {"problem_id": problem["id"], "status": "solved"},
            {"problem_id": str(uuid.uuid4()), "status": "solved"},
        ],
    }
    res = client.post(
        "/api/v1/user/import", json=good_and_bad, headers=auth(test_user)
    )
    assert res.status_code == 200
    body = res.json()["data"]
    assert body["imported"]["user_problems"] == 1
    assert len(body["errors"]) == 1

    res = client.get(f"/api/v1/user/problems/{problem['id']}", headers=auth(test_user))
    assert res.json()["data"]["status"] == "solved"

    db = SessionLocal()
    db.query(UserProblem).filter(
        UserProblem.user_id == test_user["id"], UserProblem.problem_id == problem["id"]
    ).delete()
    db.commit()
    db.close()


def test_portability_requires_auth(client):
    assert client.get("/api/v1/user/export").status_code == 401
    assert client.post("/api/v1/user/import", json={}).status_code == 401
