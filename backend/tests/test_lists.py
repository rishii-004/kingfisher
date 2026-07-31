import uuid

from app.database import SessionLocal
from app.models.user_problem import UserProblem
from tests.conftest import auth


def test_list_lists_paginated(client, test_user):
    res = client.get("/api/v1/lists?page=1&per_page=10", headers=auth(test_user))
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert set(body["data"].keys()) == {"items", "total", "page", "per_page"}
    assert body["data"]["page"] == 1
    assert isinstance(body["data"]["items"], list)


def test_list_lists_type_filter(client, test_user, global_list):
    res = client.get("/api/v1/lists?type=global", headers=auth(test_user))
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert any(i["id"] == global_list for i in items)


def test_create_list(client, test_user):
    res = client.post(
        "/api/v1/lists",
        json={"name": f"My list {uuid.uuid4().hex[:6]}", "description": "desc"},
        headers=auth(test_user),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["error"] is None
    assert body["data"]["is_custom"] is True
    return body["data"]["id"]


def test_create_update_delete_list(client, test_user):
    lid = test_create_list(client, test_user)
    res = client.put(
        f"/api/v1/lists/{lid}",
        json={"name": "Renamed"},
        headers=auth(test_user),
    )
    assert res.status_code == 200
    assert res.json()["data"]["name"] == "Renamed"

    res = client.delete(f"/api/v1/lists/{lid}", headers=auth(test_user))
    assert res.status_code == 204


def test_add_problem_to_list_and_detail(client, test_user, problem):
    lid = test_create_list(client, test_user)
    res = client.post(
        f"/api/v1/lists/{lid}/problems",
        json={"problem_id": problem["id"]},
        headers=auth(test_user),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["error"] is None
    assert body["data"]["problem_id"] == problem["id"]
    assert body["data"]["order"] == 0

    res = client.get(f"/api/v1/lists/{lid}", headers=auth(test_user))
    assert res.status_code == 200
    detail = res.json()["data"]
    assert detail["problems"][0]["id"] == problem["id"]
    assert "order" in detail["problems"][0]
    assert detail["problems"][0]["order"] == 0

    res = client.delete(
        f"/api/v1/lists/{lid}/problems/{problem['id']}", headers=auth(test_user)
    )
    assert res.status_code == 204
    client.delete(f"/api/v1/lists/{lid}", headers=auth(test_user))


def test_add_duplicate_problem_conflict(client, test_user, problem):
    lid = test_create_list(client, test_user)
    payload = {"problem_id": problem["id"]}
    assert (
        client.post(
            f"/api/v1/lists/{lid}/problems", json=payload, headers=auth(test_user)
        ).status_code
        == 201
    )
    res = client.post(
        f"/api/v1/lists/{lid}/problems", json=payload, headers=auth(test_user)
    )
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "CONFLICT"
    assert (
        client.delete(f"/api/v1/lists/{lid}", headers=auth(test_user)).status_code
        == 204
    )


def test_get_list_not_found(client, test_user):
    res = client.get(
        "/api/v1/lists/00000000-0000-0000-0000-000000000000", headers=auth(test_user)
    )
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"


def test_get_global_list_detail(client, test_user, global_list):
    res = client.get(f"/api/v1/lists/{global_list}", headers=auth(test_user))
    assert res.status_code == 200
    assert res.json()["data"]["is_global"] is True
    assert res.json()["data"]["problems"] == []


def test_fork_global_list(client, test_user, global_list):
    res = client.post(f"/api/v1/lists/{global_list}/fork", headers=auth(test_user))
    assert res.status_code == 201
    body = res.json()
    assert body["error"] is None
    assert body["data"]["is_custom"] is True
    forked_id = body["data"]["id"]
    client.delete(f"/api/v1/lists/{forked_id}", headers=auth(test_user))


def test_reset_global_list(client, test_user, global_list):
    res = client.post(f"/api/v1/lists/{global_list}/reset", headers=auth(test_user))
    assert res.status_code == 204


def test_reset_list_with_solved_problem_and_review(client, test_user, problem, global_list):
    fork = client.post(f"/api/v1/lists/{global_list}/fork", headers=auth(test_user))
    list_id = fork.json()["data"]["id"]
    client.post(
        f"/api/v1/lists/{list_id}/problems",
        json={"problem_id": problem["id"]},
        headers=auth(test_user),
    )

    client.put(
        f"/api/v1/user/problems/{problem['id']}/status",
        json={"status": "solved"},
        headers=auth(test_user),
    )
    res = client.post(
        f"/api/v1/user/problems/{problem['id']}/solve-log",
        json={"mistake_tags": [], "notes": "n", "time_spent": "<15m"},
        headers=auth(test_user),
    )
    assert res.status_code == 201

    # A solve log with a scheduled review is exactly the case that
    # previously violated the reviews.solve_log_id FK on reset (Review
    # must be deleted before the SolveLog it points to).
    res = client.post(f"/api/v1/lists/{list_id}/reset", headers=auth(test_user))
    assert res.status_code == 204

    res = client.get(f"/api/v1/user/problems/{problem['id']}", headers=auth(test_user))
    assert res.json()["data"]["status"] == "todo"

    res = client.get(f"/api/v1/user/problems/{problem['id']}/solve-log", headers=auth(test_user))
    assert res.status_code == 404

    client.delete(f"/api/v1/lists/{list_id}", headers=auth(test_user))
    db = SessionLocal()
    db.query(UserProblem).filter(UserProblem.problem_id == problem["id"]).delete()
    db.commit()
    db.close()


def test_lists_require_auth(client):
    assert client.get("/api/v1/lists").status_code == 401
