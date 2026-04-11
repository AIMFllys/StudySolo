from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    agent_name: str = "code-review"
    version: str = "0.1.0"
    model_id: str = "code-review-v1"
    api_key: str = "code-review-secret"
    host: str = "127.0.0.1"
    port: int = 8001
    review_backend: Literal["heuristic", "upstream_reserved"] = "heuristic"
    upstream_model: str | None = None
    upstream_base_url: str | None = None
    upstream_api_key: str | None = None
    upstream_timeout_seconds: float = 30.0

    model_config = SettingsConfigDict(
        env_prefix="AGENT_",
        env_file=".env",
        extra="ignore",
    )

    @property
    def models(self) -> list[str]:
        return [self.model_id]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
