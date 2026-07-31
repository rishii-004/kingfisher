import uuid

from tests.conftest import auth


def _new_problem_body():
    suffix = uuid.uuid4().hex[:8]
    return {
        "title": f"Admin Problem {suffix}",
        "slug": f"admin-problem-{suffix}",
        "platform": "leetcode",
        "platform_url": "https://leetcode.com/problems/admin-problem",
        "difficulty": "easy",
        "topic_tags": ["Array"],
        "company_tags": ["Google"],
    }


def test_admin_routes_require_admin(client, test_user):
    assert client.get("/api/v1/admin/problems", headers=auth(test_user)).status_code == 403
    assert client.get("/api/v1/admin/lists", headers=auth(test_user)).status_code == 403
    assert client.get("/api/v1/admin/users", headers=auth(test_user)).status_code == 403
    res = client.post(
        "/api/v1/admin/problems", json=_new_problem_body(), headers=auth(test_user)
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"


def test_admin_problem_crud(client, admin_user):
    res = client.post(
        "/api/v1/admin/problems", json=_new_problem_body(), headers=auth(admin_user)
    )
    assert res.status_code == 201
    pid = res.json()["data"]["id"]

    res = client.get("/api/v1/admin/problems?per_page=100", headers=auth(admin_user))
    assert res.status_code == 200
    assert any(p["id"] == pid for p in res.json()["data"]["items"])

    res = client.put(
        f"/api/v1/admin/problems/{pid}",
        json={"difficulty": "hard"},
        headers=auth(admin_user),
    )
    assert res.status_code == 200
    assert res.json()["data"]["difficulty"] == "hard"

    res = client.delete(f"/api/v1/admin/problems/{pid}", headers=auth(admin_user))
    assert res.status_code == 204


def test_admin_duplicate_slug_conflict(client, admin_user):
    body = _new_problem_body()
    res = client.post("/api/v1/admin/problems", json=body, headers=auth(admin_user))
    assert res.status_code == 201
    pid = res.json()["data"]["id"]

    res = client.post("/api/v1/admin/problems", json=body, headers=auth(admin_user))
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "CONFLICT"

    client.delete(f"/api/v1/admin/problems/{pid}", headers=auth(admin_user))


def test_admin_list_crud_and_add_problem(client, admin_user):
    suffix = uuid.uuid4().hex[:8]
    res = client.post(
        "/api/v1/admin/lists",
        json={"name": f"Admin List {suffix}", "description": "curated"},
        headers=auth(admin_user),
    )
    assert res.status_code == 201
    lid = res.json()["data"]["id"]
    assert res.json()["data"]["is_global"] is True

    res = client.get("/api/v1/admin/lists?per_page=100", headers=auth(admin_user))
    assert res.status_code == 200
    assert any(lst["id"] == lid for lst in res.json()["data"]["items"])

    pres = client.post(
        "/api/v1/admin/problems", json=_new_problem_body(), headers=auth(admin_user)
    )
    pid = pres.json()["data"]["id"]

    res = client.post(
        f"/api/v1/admin/lists/{lid}/problems",
        json={"problem_id": pid},
        headers=auth(admin_user),
    )
    assert res.status_code == 201
    assert res.json()["data"]["problem_id"] == pid

    res = client.delete(
        f"/api/v1/admin/lists/{lid}/problems/{pid}", headers=auth(admin_user)
    )
    assert res.status_code == 204

    client.delete(f"/api/v1/admin/problems/{pid}", headers=auth(admin_user))
    res = client.delete(f"/api/v1/admin/lists/{lid}", headers=auth(admin_user))
    assert res.status_code == 204


def test_admin_user_management(client, admin_user, test_user):
    res = client.get(
        f"/api/v1/admin/users?q={test_user['username']}", headers=auth(admin_user)
    )
    assert res.status_code == 200
    assert any(u["id"] == test_user["id"] for u in res.json()["data"]["items"])

    res = client.patch(
        f"/api/v1/admin/users/{admin_user['id']}/toggle-admin", headers=auth(admin_user)
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "BAD_REQUEST"

    res = client.delete(
        f"/api/v1/admin/users/{admin_user['id']}", headers=auth(admin_user)
    )
    assert res.status_code == 400


def test_update_max_lists_requires_admin(client, test_user):
    res = client.patch(
        f"/api/v1/admin/users/{test_user['id']}/max-lists",
        json={"max_lists": 50},
        headers=auth(test_user),
    )
    assert res.status_code == 403


def test_update_max_lists(client, admin_user, test_user):
    res = client.patch(
        f"/api/v1/admin/users/{test_user['id']}/max-lists",
        json={"max_lists": 50},
        headers=auth(admin_user),
    )
    assert res.status_code == 200
    assert res.json()["data"]["max_lists"] == 50

    # restore the default so other tests relying on the 30-list quota
    # for this session-scoped user aren't affected
    res = client.patch(
        f"/api/v1/admin/users/{test_user['id']}/max-lists",
        json={"max_lists": 30},
        headers=auth(admin_user),
    )
    assert res.status_code == 200


def test_update_max_lists_rejects_negative(client, admin_user, test_user):
    res = client.patch(
        f"/api/v1/admin/users/{test_user['id']}/max-lists",
        json={"max_lists": -1},
        headers=auth(admin_user),
    )
    assert res.status_code == 422


def test_update_max_lists_user_not_found(client, admin_user):
    res = client.patch(
        "/api/v1/admin/users/00000000-0000-0000-0000-000000000000/max-lists",
        json={"max_lists": 10},
        headers=auth(admin_user),
    )
    assert res.status_code == 404
