from fastapi import APIRouter, Depends

from scheduler_engine.api.dependencies import SettingsDep, verify_internal_api_key
from scheduler_engine.schemas.schedule_generate import (
    GenerateScheduleRequest,
    GenerateScheduleResponse,
)
from scheduler_engine.services.schedule_generator import ScheduleGeneratorService

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
    return ScheduleGeneratorService().generate(payload)
