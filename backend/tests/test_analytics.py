from app.database import SessionLocal
from app.models.review import Review
from app.models.solve_log import SolveLog
from app.models.user_problem import UserProblem
from tests.conftest import auth

SIMPLE_LIST_ENDPOINTS = [
    "radar",
    "time-trends",
    "weekly-pattern",
    "topic-mastery",
    "company",
    "mistakes",
]

OBJECT_ENDPOINTS = ["difficulty", "review-pipeline", "consistency"]


def test_analytics_endpoints_return_200(client, test_user):
    for path in SIMPLE_LIST_ENDPOINTS:
        res = client.get(f"/api/v1/analytics/{path}", headers=auth(test_user))
        assert res.status_code == 200, path
        assert res.json()["error"] is None
        assert isinstance(res.json()["data"], list), path

    for path in OBJECT_ENDPOINTS:
        res = client.get(f"/api/v1/analytics/{path}", headers=auth(test_user))
        assert res.status_code == 200, path
        assert isinstance(res.json()["data"], dict), path


def test_heatmap_zero_fills_full_year(client, test_user):
    res = client.get("/api/v1/analytics/heatmap?year=2025", headers=auth(test_user))
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) == 365
    assert data[0]["date"] == "2025-01-01"
    assert data[-1]["date"] == "2025-12-31"


def test_difficulty_breakdown_includes_totals(client, test_user, problem):
    res = client.get("/api/v1/analytics/difficulty", headers=auth(test_user))
    assert res.status_code == 200
    body = res.json()["data"]
    assert set(body.keys()) == {
        "easy", "medium", "hard", "easy_total", "medium_total", "hard_total",
    }
    assert body["medium_total"] >= 1  # the `problem` fixture is difficulty=medium


def test_topic_mastery_reflects_solved_and_mistakes(client, test_user, problem):
    client.put(
        f"/api/v1/user/problems/{problem['id']}/status",
        json={"status": "solved"},
        headers=auth(test_user),
    )
    client.post(
        f"/api/v1/user/problems/{problem['id']}/solve-log",
        json={"mistake_tags": ["off_by_one"], "notes": "n", "time_spent": "<15m"},
        headers=auth(test_user),
    )

    res = client.get("/api/v1/analytics/topic-mastery", headers=auth(test_user))
    topic = next(t for t in res.json()["data"] if t["topic"] == "arrays")
    assert topic["solved"] >= 1
    assert topic["mistakes"] >= 1

    res = client.get("/api/v1/analytics/mistakes", headers=auth(test_user))
    off_by_one = next(m for m in res.json()["data"] if m["tag"] == "off_by_one")
    assert off_by_one["count"] >= 1

    db = SessionLocal()
    db.query(Review).filter(Review.problem_id == problem["id"]).delete()
    db.query(SolveLog).filter(SolveLog.problem_id == problem["id"]).delete()
    db.query(UserProblem).filter(UserProblem.problem_id == problem["id"]).delete()
    db.commit()
    db.close()


def test_analytics_requires_auth(client):
    assert client.get("/api/v1/analytics/difficulty").status_code == 401
