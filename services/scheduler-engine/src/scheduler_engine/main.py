from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from scheduler_engine import __version__
from scheduler_engine.api import router as api_router
from scheduler_engine.core.config import get_settings
from scheduler_engine.core.logging import configure_logging
from scheduler_engine.core.middleware import RequestIdMiddleware


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings)
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        description="Internal API for schedule processing (called by NestJS backend only).",
        lifespan=lifespan,
        docs_url="/docs" if settings.environment == "development" else None,
        redoc_url="/redoc" if settings.environment == "development" else None,
        openapi_url="/openapi.json" if settings.environment == "development" else None,
    )

    app.add_middleware(RequestIdMiddleware)
    app.include_router(api_router)

    return app


app = create_app()
