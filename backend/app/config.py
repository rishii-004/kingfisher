from pydantic import model_validator
from pydantic_settings import BaseSettings

INSECURE_DEFAULT_SECRET_KEY = "change-me-in-production"


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"  # "development" | "production"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5433/kingfisher"
    SECRET_KEY: str = INSECURE_DEFAULT_SECRET_KEY
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # Comma-separated list of allowed origins, e.g.
    # "https://app.example.com,https://example.com"
    CORS_ORIGINS: str = "http://localhost:5173"
    # If set, this user is promoted to admin on startup (see app/bootstrap.py).
    INITIAL_ADMIN_EMAIL: str | None = None

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @model_validator(mode="after")
    def _require_real_secret_in_production(self) -> "Settings":
        if self.ENVIRONMENT == "production" and self.SECRET_KEY == INSECURE_DEFAULT_SECRET_KEY:
            raise ValueError(
                "SECRET_KEY is still the insecure default — set a real "
                "SECRET_KEY before running with ENVIRONMENT=production."
            )
        return self


settings = Settings()
