from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "scheduler-engine"
    environment: Literal["development", "staging", "production"] = "development"
    port: int = Field(default=8000, ge=1, le=65535)
    log_level: str = "INFO"

    # Optional shared secret for calls from NestJS (empty = disabled in development)
    internal_api_key: str = ""

    # Reserved for async workers / job queue
    redis_url: str = "redis://localhost:6379"


@lru_cache
def get_settings() -> Settings:
    return Settings()
