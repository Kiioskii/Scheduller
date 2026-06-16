from fastapi import APIRouter

from scheduler_engine.api.v1 import files, health, schedules

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(files.router)
api_router.include_router(schedules.router)
