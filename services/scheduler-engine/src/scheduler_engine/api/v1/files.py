from urllib.parse import quote

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from scheduler_engine.api.dependencies import SettingsDep, verify_internal_api_key
from scheduler_engine.schemas.podklad import PodkladTemplateQuery
from scheduler_engine.services.podklad_generator import (
    format_podklad_file_name,
    generate_podklad_bytes,
)

router = APIRouter(prefix="/files", tags=["files"], dependencies=[Depends(verify_internal_api_key)])


def _ascii_file_name(file_name: str) -> str:
    return (
        file_name.replace("Ł", "L")
        .replace("ł", "l")
        .replace('"', "")
        .encode("ascii", "replace")
        .decode("ascii")
        .replace("?", "_")
    )


def _content_disposition(file_name: str) -> str:
    ascii_fallback = _ascii_file_name(file_name)
    return f"attachment; filename=\"{ascii_fallback}\"; filename*=UTF-8''{quote(file_name)}"


def _parse_holiday_dates_param(holiday_dates: str | None) -> list[str] | None:
    if not holiday_dates:
        return None
    dates = [part.strip() for part in holiday_dates.split(",") if part.strip()]
    return dates or None


@router.get("/podklad/template")
def download_podklad_template(
    _settings: SettingsDep,
    year: int = Query(ge=2000, le=2100),
    month: int = Query(ge=1, le=12),
    holiday_dates: str | None = Query(
        default=None,
        description="Comma-separated ISO dates (YYYY-MM-DD) to mark as holidays",
    ),
) -> Response:
    query = PodkladTemplateQuery(
        year=year,
        month=month,
        holiday_dates=_parse_holiday_dates_param(holiday_dates),
    )
    content = generate_podklad_bytes(query.year, query.month, query.holiday_dates)
    file_name = format_podklad_file_name(query.year, query.month)

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": _content_disposition(file_name),
            "X-File-Name": _ascii_file_name(file_name),
        },
    )
