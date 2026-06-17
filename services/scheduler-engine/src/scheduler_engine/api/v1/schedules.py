from uuid import uuid4

from fastapi import APIRouter, Depends

from scheduler_engine.api.dependencies import SettingsDep, verify_internal_api_key
from scheduler_engine.schemas.schedule_generate import (
    GenerateScheduleRequest,
    GenerateScheduleResponse,
)

router = APIRouter(
    prefix="/schedules",
    tags=["schedules"],
    dependencies=[Depends(verify_internal_api_key)],
)


@router.post("/generate", response_model=GenerateScheduleResponse)
def generate_schedule(
    _settings: SettingsDep,
    payload: GenerateScheduleRequest,
) -> GenerateScheduleResponse:
    """Stub endpoint — accepts schedule generation payload without running the solver yet."""
    return GenerateScheduleResponse(
        job_id=str(uuid4()),
        status="accepted",
        message="Schedule generation is not implemented yet",
        draft_count=len(payload.worker_drafts),
        holiday_count=len(payload.holidays),
    )
