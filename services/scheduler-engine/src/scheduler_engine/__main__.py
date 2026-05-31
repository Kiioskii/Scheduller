import uvicorn

from scheduler_engine.core.config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "scheduler_engine.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
