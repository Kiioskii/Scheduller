from fastapi import APIRouter, Depends

from scheduler_engine import __version__
from scheduler_engine.api.dependencies import SettingsDep, verify_internal_api_key
from scheduler_engine.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health/live", response_model=HealthResponse)
def health_live(settings: SettingsDep) -> HealthResponse:
    """Liveness probe for Docker/orchestrator — no API key required."""
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=__version__,
        environment=settings.environment,
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    dependencies=[Depends(verify_internal_api_key)],
)
def health(settings: SettingsDep) -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=__version__,
        environment=settings.environment,
    )
