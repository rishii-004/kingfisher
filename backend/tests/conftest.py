import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.list import ProblemList
from app.models.problem import Problem
from app.models.review import Review
from app.models.user import User


def auth(user):
    return {"Authorization": f"Bearer {user['access_token']}"}


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def test_user(client):
    suffix = uuid.uuid4().hex[:8]
    body = {
        "email": f"user_{suffix}@test.com",
        "username": f"user_{suffix}",
        "password": "testpass123",
    }
    res = client.post("/api/v1/auth/register", json=body)
    assert res.status_code == 201, res.text
    data = res.json()["data"]
    return {
        "email": body["email"],
        "password": body["password"],
        "username": body["username"],
        "access_token": data["access_token"],
        "refresh_token": data["refresh_token"],
        "id": str(data["user"]["id"]),
    }


@pytest.fixture(scope="session")
def admin_user(client):
    suffix = uuid.uuid4().hex[:8]
    body = {
        "email": f"admin_{suffix}@test.com",
        "username": f"admin_{suffix}",
        "password": "testpass123",
    }
    res = client.post("/api/v1/auth/register", json=body)
    assert res.status_code == 201, res.text
    data = res.json()["data"]

    db = SessionLocal()
    user = db.query(User).filter(User.id == data["user"]["id"]).first()
    user.is_admin = True
    db.commit()
    db.close()

    return {
        "email": body["email"],
        "password": body["password"],
        "username": body["username"],
        "access_token": data["access_token"],
        "refresh_token": data["refresh_token"],
        "id": str(data["user"]["id"]),
    }


@pytest.fixture
def problem():
    db = SessionLocal()
    suffix = uuid.uuid4().hex[:8]
    p = Problem(
        title=f"Test Problem {suffix}",
        slug=f"test-problem-{suffix}",
        platform="leetcode",
        platform_url="https://leetcode.com/problems/test",
        difficulty="medium",
        topic_tags=["arrays"],
        company_tags=["google"],
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    pid = str(p.id)
    slug = p.slug
    db.close()
    yield {"id": pid, "slug": slug}
    db = SessionLocal()
    db.query(Problem).filter(Problem.id == pid).delete()
    db.commit()
    db.close()


@pytest.fixture
def global_list():
    db = SessionLocal()
    gl = ProblemList(
        name=f"Global {uuid.uuid4().hex[:8]}",
        description="global test list",
        is_global=True,
        is_custom=False,
        owner_id=None,
    )
    db.add(gl)
    db.commit()
    db.refresh(gl)
    gid = str(gl.id)
    db.close()
    yield gid
    db = SessionLocal()
    db.query(ProblemList).filter(ProblemList.id == gid).delete()
    db.commit()
    db.close()


@pytest.fixture
def due_review(problem, test_user):
    db = SessionLocal()
    r = Review(
        user_id=test_user["id"],
        problem_id=problem["id"],
        interval_days=7,
        due_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        review_stage=0,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    rid = str(r.id)
    db.close()
    yield rid
    db = SessionLocal()
    db.query(Review).filter(Review.id == rid).delete()
    db.commit()
    db.close()
