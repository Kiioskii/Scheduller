def test_health_returns_ok(client) -> None:
    response = client.get("/internal/v1/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "scheduler-engine"
    assert "version" in data
    assert data["environment"] == "development"


def test_health_live_returns_ok_without_api_key(monkeypatch) -> None:
    from fastapi.testclient import TestClient

    from scheduler_engine.core.config import get_settings
    from scheduler_engine.main import create_app

    monkeypatch.setenv("INTERNAL_API_KEY", "secret-key")
    get_settings.cache_clear()

    with TestClient(create_app()) as client:
        response = client.get("/internal/v1/health/live")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_requires_api_key_when_configured(monkeypatch) -> None:
    from fastapi.testclient import TestClient

    from scheduler_engine.core.config import get_settings
    from scheduler_engine.main import create_app

    monkeypatch.setenv("INTERNAL_API_KEY", "secret-key")
    get_settings.cache_clear()

    with TestClient(create_app()) as client:
        response = client.get("/internal/v1/health")

    assert response.status_code == 401


def test_health_includes_request_id_header(client) -> None:
    response = client.get("/internal/v1/health/live", headers={"X-Request-Id": "test-req-1"})

    assert response.status_code == 200
    assert response.headers.get("X-Request-Id") == "test-req-1"
