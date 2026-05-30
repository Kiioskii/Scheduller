from fastapi import APIRouter

from scheduler_engine.api.v1 import api_router as v1_router

router = APIRouter(prefix="/internal")
router.include_router(v1_router, prefix="/v1")
