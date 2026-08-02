import logging

from app.config import settings
from app.database import SessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)


def bootstrap_initial_admin() -> None:
    """Promote INITIAL_ADMIN_EMAIL to admin if that user already exists.

    Closes the "how do I get my first admin" gap without a full
    invite/role system — set the env var, register normally, restart.
    """
    if not settings.INITIAL_ADMIN_EMAIL:
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == settings.INITIAL_ADMIN_EMAIL).first()
        if user is None:
            logger.warning(
                "INITIAL_ADMIN_EMAIL=%s is set but no matching user exists yet — "
                "register that account, then restart the app to promote it.",
                settings.INITIAL_ADMIN_EMAIL,
            )
            return
        if not user.is_admin:
            user.is_admin = True
            db.commit()
            logger.info("Promoted %s to admin (INITIAL_ADMIN_EMAIL).", settings.INITIAL_ADMIN_EMAIL)
    finally:
        db.close()
