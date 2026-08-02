import uuid

from tests.conftest import auth


def _register(client):
    suffix = uuid.uuid4().hex[:8]
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"other_{suffix}@test.com",
            "username": f"other_{suffix}",
            "password": "testpass123",
        },
    )
    assert res.status_code == 201
    data = res.json()["data"]
    return {"access_token": data["access_token"], "id": str(data["user"]["id"])}


def test_review_count_envelope(client, test_user, due_review):
    res = client.get("/api/v1/reviews/count", headers=auth(test_user))
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert isinstance(body["data"]["count"], int)
    assert body["data"]["count"] >= 1


def test_due_reviews_paginated(client, test_user, due_review, problem):
    res = client.get("/api/v1/reviews/due?page=1&per_page=20", headers=auth(test_user))
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert set(body["data"].keys()) == {"items", "total", "page", "per_page"}
    items = body["data"]["items"]
    match = next(i for i in items if i["id"] == due_review)
    assert match["problem"]["id"] == problem["id"]


def test_complete_review(client, test_user, due_review):
    res = client.post(f"/api/v1/reviews/{due_review}/complete", headers=auth(test_user))
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert body["data"]["review_stage"] == 1
    assert body["data"]["interval_days"] == 14


def test_complete_review_forbidden(client, test_user, due_review):
    other = _register(client)
    res = client.post(
        f"/api/v1/reviews/{due_review}/complete",
        headers=auth(other),
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"


def test_complete_missing_review(client, test_user):
    res = client.post(
        "/api/v1/reviews/00000000-0000-0000-0000-000000000000/complete",
        headers=auth(test_user),
    )
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"


def test_reviews_require_auth(client):
    assert client.get("/api/v1/reviews/count").status_code == 401
