from tests.conftest import auth


def test_platforms_is_public(client):
    res = client.get("/api/v1/problems/platforms")
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert len(body["data"]["platforms"]) >= 1


def test_list_problems_paginated(client, test_user):
    res = client.get("/api/v1/problems?page=1&per_page=5", headers=auth(test_user))
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert set(body["data"].keys()) == {"items", "total", "page", "per_page"}
    assert body["data"]["page"] == 1
    assert body["data"]["per_page"] == 5
    assert isinstance(body["data"]["items"], list)


def test_list_problems_requires_auth(client):
    res = client.get("/api/v1/problems")
    assert res.status_code == 401
    body = res.json()
    assert body["data"] is None
    assert body["error"]["code"] == "UNAUTHORIZED"


def test_get_problem_by_id(client, test_user, problem):
    res = client.get(f"/api/v1/problems/{problem['id']}", headers=auth(test_user))
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert body["data"]["id"] == problem["id"]


def test_get_problem_by_slug(client, test_user, problem):
    res = client.get(f"/api/v1/problems/{problem['slug']}", headers=auth(test_user))
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert body["data"]["slug"] == problem["slug"]


def test_get_problem_not_found(client, test_user):
    res = client.get(
        "/api/v1/problems/00000000-0000-0000-0000-000000000000", headers=auth(test_user)
    )
    assert res.status_code == 404
    body = res.json()
    assert body["data"] is None
    assert body["error"]["code"] == "NOT_FOUND"


def test_get_problem_requires_auth(client, problem):
    res = client.get(f"/api/v1/problems/{problem['id']}")
    assert res.status_code == 401
