import os

import pytest
from fastapi.testclient import TestClient

# Ensure tests use predictable settings before app import side effects
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("INTERNAL_API_KEY", "")

from scheduler_engine.main import create_app  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_settings_cache() -> None:
    from scheduler_engine.core.config import get_settings

    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(create_app())
