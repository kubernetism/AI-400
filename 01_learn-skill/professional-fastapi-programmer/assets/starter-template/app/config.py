"""Application configuration using pydantic-settings."""
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "FastAPI Application"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "postgresql://user:password@localhost:5432/dbname"
    db_pool_size: int = 5
    db_max_overflow: int = 10

    # Security
    api_key_header: str = "X-API-Key"
    api_keys: list[str] = []

    # CORS
    allowed_origins: list[str] = ["*"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }

    @property
    def api_keys_set(self) -> set[str]:
        """Convert API keys to set for O(1) lookup."""
        return set(self.api_keys)


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
