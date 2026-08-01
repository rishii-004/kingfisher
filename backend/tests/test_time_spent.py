from datetime import date, timedelta

from app.database import SessionLocal
from app.models.daily_time_spent import DailyTimeSpent
from tests.conftest import auth


def _cleanup(user_id):
    db = SessionLocal()
    db.query(DailyTimeSpent).filter(DailyTimeSpent.user_id == user_id).delete()
    db.commit()
    db.close()


def test_post_time_spent_requires_auth(client):
    res = client.post("/api/v1/user/time-spent", json={"date": "2026-01-01", "seconds": 30})
    assert res.status_code == 401


def test_post_time_spent_accumulates(client, test_user):
    today = date.today().isoformat()
    res = client.post(
        "/api/v1/user/time-spent",
        json={"date": today, "seconds": 30},
        headers=auth(test_user),
    )
    assert res.status_code == 204

    res = client.post(
        "/api/v1/user/time-spent",
        json={"date": today, "seconds": 45},
        headers=auth(test_user),
    )
    assert res.status_code == 204

    res = client.get(f"/api/v1/analytics/time-spent-week?today={today}", headers=auth(test_user))
    assert res.status_code == 200
    days = res.json()["data"]
    todays_entry = next(d for d in days if d["date"] == today)
    assert todays_entry["minutes"] == round((30 + 45) / 60)

    _cleanup(test_user["id"])


def test_post_time_spent_rejects_out_of_range(client, test_user):
    today = date.today().isoformat()
    res = client.post(
        "/api/v1/user/time-spent",
        json={"date": today, "seconds": -1},
        headers=auth(test_user),
    )
    assert res.status_code == 422

    res = client.post(
        "/api/v1/user/time-spent",
        json={"date": today, "seconds": 301},
        headers=auth(test_user),
    )
    assert res.status_code == 422


def test_time_spent_week_uses_today_override_for_window(client, test_user):
    anchor = date(2026, 3, 15)
    in_window = anchor - timedelta(days=6)
    out_of_window = anchor - timedelta(days=7)

    db = SessionLocal()
    db.add(DailyTimeSpent(user_id=test_user["id"], date=in_window, seconds=120))
    db.add(DailyTimeSpent(user_id=test_user["id"], date=out_of_window, seconds=600))
    db.commit()
    db.close()

    res = client.get(
        f"/api/v1/analytics/time-spent-week?today={anchor.isoformat()}",
        headers=auth(test_user),
    )
    assert res.status_code == 200
    days = res.json()["data"]
    assert len(days) == 7
    assert days[0]["date"] == in_window.isoformat()
    assert days[0]["minutes"] == 2
    assert all(d["date"] != out_of_window.isoformat() for d in days)

    _cleanup(test_user["id"])
