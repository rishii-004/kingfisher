from tests.conftest import auth


def test_search_missing_q(client, test_user):
    res = client.get("/api/v1/user/search", headers=auth(test_user))
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "BAD_REQUEST"


def test_search_finds_problem(client, test_user, problem):
    res = client.get(
        f"/api/v1/user/search?q={problem['slug'][:6]}", headers=auth(test_user)
    )
    assert res.status_code == 200
    body = res.json()["data"]
    assert set(body.keys()) == {"results", "total", "page", "per_page"}
    match = next(
        (r for r in body["results"] if r["type"] == "problem" and r["data"]["id"] == problem["id"]),
        None,
    )
    assert match is not None
    assert 0 <= match["relevance"] <= 1


def test_search_finds_list(client, test_user, global_list):
    res = client.get("/api/v1/user/search?q=global", headers=auth(test_user))
    assert res.status_code == 200
    results = res.json()["data"]["results"]
    match = next((r for r in results if r["type"] == "list" and r["data"]["id"] == global_list), None)
    assert match is not None
    assert "problem_count" in match["data"]


def test_search_respects_per_page(client, test_user, problem):
    res = client.get(
        f"/api/v1/user/search?q={problem['slug'][:3]}&per_page=1", headers=auth(test_user)
    )
    assert res.status_code == 200
    body = res.json()["data"]
    assert len(body["results"]) <= 1
    assert body["per_page"] == 1


def test_search_requires_auth(client):
    assert client.get("/api/v1/user/search?q=x").status_code == 401
