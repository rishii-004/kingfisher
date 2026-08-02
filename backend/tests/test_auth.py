import uuid


def _register(client, email=None):
    suffix = uuid.uuid4().hex[:8]
    return client.post(
        "/api/v1/auth/register",
        json={
            "email": email or f"extra_{suffix}@test.com",
            "username": f"extra_{suffix}",
            "password": "testpass123",
        },
    )


def test_register_returns_envelope(client):
    res = _register(client)
    assert res.status_code == 201
    body = res.json()
    assert body["error"] is None
    data = body["data"]
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["user"]["is_admin"] is False


def test_register_duplicate_email_conflict(client, test_user):
    res = _register(client, email=test_user["email"])
    assert res.status_code == 409
    body = res.json()
    assert body["data"] is None
    assert body["error"]["code"] == "CONFLICT"


def test_register_validation_error(client):
    res = client.post("/api/v1/auth/register", json={"email": "not-an-email"})
    assert res.status_code == 422
    body = res.json()
    assert body["data"] is None
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_login_returns_envelope(client, test_user):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": test_user["email"], "password": test_user["password"]},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert body["data"]["user"]["id"] == test_user["id"]
    assert body["data"]["access_token"]


def test_login_wrong_password(client, test_user):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": test_user["email"], "password": "wrong-password"},
    )
    assert res.status_code == 401
    body = res.json()
    assert body["data"] is None
    assert body["error"]["code"] == "UNAUTHORIZED"


def test_refresh_returns_envelope(client, test_user):
    res = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": test_user["refresh_token"]}
    )
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert body["data"]["access_token"]
    assert body["data"]["refresh_token"]


def test_refresh_invalid_token(client):
    res = client.post("/api/v1/auth/refresh", json={"refresh_token": "garbage"})
    assert res.status_code == 401
    body = res.json()
    assert body["data"] is None
    assert body["error"]["code"] == "UNAUTHORIZED"


def test_me_returns_envelope(client, test_user):
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {test_user['access_token']}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["error"] is None
    assert body["data"]["id"] == test_user["id"]


def test_me_unauthorized(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
    body = res.json()
    assert body["data"] is None
    assert body["error"]["code"] == "UNAUTHORIZED"
