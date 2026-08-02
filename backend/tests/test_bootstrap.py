from app.bootstrap import bootstrap_initial_admin
from app.config import settings


def test_bootstrap_promotes_existing_user(test_user, monkeypatch):
    from app.database import SessionLocal
    from app.models.user import User

    monkeypatch.setattr(settings, "INITIAL_ADMIN_EMAIL", test_user["email"])
    bootstrap_initial_admin()

    db = SessionLocal()
    user = db.query(User).filter(User.email == test_user["email"]).first()
    was_admin = user.is_admin
    user.is_admin = False  # restore, this fixture is session-scoped
    db.commit()
    db.close()

    assert was_admin is True


def test_bootstrap_noop_without_env_var(monkeypatch):
    monkeypatch.setattr(settings, "INITIAL_ADMIN_EMAIL", None)
    bootstrap_initial_admin()  # should not raise


def test_bootstrap_noop_for_unknown_email(monkeypatch):
    monkeypatch.setattr(settings, "INITIAL_ADMIN_EMAIL", "nobody@nowhere.test")
    bootstrap_initial_admin()  # should log a warning, not raise
