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


def _register(client, prefix):
    suffix = uuid.uuid4().hex[:8]
    body = {
        "email": f"{prefix}_{suffix}@test.com",
        "username": f"{prefix}_{suffix}",
        "password": "testpass123",
    }
    res = client.post("/api/v1/auth/register", json=body)
    assert res.status_code == 201, res.text
    data = res.json()["data"]
    return {"access_token": data["access_token"], "id": str(data["user"]["id"])}


def test_list_quota_enforced_then_lifted_by_admin(client, admin_user):
    user = _register(client, "quota")
    created = []
    for i in range(30):
        res = client.post(
            "/api/v1/lists", json={"name": f"Quota list {i}"}, headers=auth(user)
        )
        assert res.status_code == 201, res.text
        created.append(res.json()["data"]["id"])

    res = client.post(
        "/api/v1/lists", json={"name": "One too many"}, headers=auth(user)
    )
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "CONFLICT"

    # Admin raises this user's quota; creation now succeeds.
    res = client.patch(
        f"/api/v1/admin/users/{user['id']}/max-lists",
        json={"max_lists": 31},
        headers=auth(admin_user),
    )
    assert res.status_code == 200
    assert res.json()["data"]["max_lists"] == 31

    res = client.post(
        "/api/v1/lists", json={"name": "One too many"}, headers=auth(user)
    )
    assert res.status_code == 201
    created.append(res.json()["data"]["id"])

    for lid in created:
        client.delete(f"/api/v1/lists/{lid}", headers=auth(user))


def test_list_quota_does_not_apply_to_admin(client, admin_user):
    created = []
    for i in range(31):
        res = client.post(
            "/api/v1/lists", json={"name": f"Admin quota list {i}"}, headers=auth(admin_user)
        )
        assert res.status_code == 201, res.text
        created.append(res.json()["data"]["id"])
    for lid in created:
        client.delete(f"/api/v1/lists/{lid}", headers=auth(admin_user))


def test_create_list_from_filter(client, test_user, problem):
    # The `problem` fixture always creates a "medium" difficulty problem.
    res = client.post(
        "/api/v1/lists/from-filter",
        json={"name": f"From filter {uuid.uuid4().hex[:6]}", "difficulty": "medium"},
        headers=auth(test_user),
    )
    assert res.status_code == 201, res.text
    body = res.json()["data"]
    assert body["is_custom"] is True
    assert body["problem_count"] >= 1
    client.delete(f"/api/v1/lists/{body['id']}", headers=auth(test_user))


def test_create_list_from_filter_requires_a_filter(client, test_user):
    res = client.post(
        "/api/v1/lists/from-filter",
        json={"name": "No filters"},
        headers=auth(test_user),
    )
    assert res.status_code == 422


def test_create_list_from_filter_no_matches(client, test_user):
    res = client.post(
        "/api/v1/lists/from-filter",
        json={"name": "No matches", "q": uuid.uuid4().hex},
        headers=auth(test_user),
    )
    assert res.status_code == 400
