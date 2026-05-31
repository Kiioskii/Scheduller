from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status

from scheduler_engine.core.config import Settings, get_settings

SettingsDep = Annotated[Settings, Depends(get_settings)]


def verify_internal_api_key(
    request: Request,
    settings: SettingsDep,
    x_internal_api_key: Annotated[str | None, Header()] = None,
) -> None:
    """Require shared secret when INTERNAL_API_KEY is configured."""
    if not settings.internal_api_key:
        return

    if x_internal_api_key != settings.internal_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal API key",
        )
