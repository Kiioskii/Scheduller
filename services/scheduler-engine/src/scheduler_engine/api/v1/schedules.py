from __future__ import annotations

import base64

from fastapi import APIRouter, Depends

from scheduler_engine.api.dependencies import SettingsDep, verify_internal_api_key
from scheduler_engine.schemas.schedule_export import ExportGrafikPdfRequest, ExportGrafikPdfResponse
from scheduler_engine.schemas.schedule_generate import (
    GenerateScheduleRequest,
    GenerateScheduleResponse,
)
from scheduler_engine.services.grafik_pdf import render_grafik_pdf
from scheduler_engine.services.schedule_generator import ScheduleGeneratorService
from scheduler_engine.services.schedule_preview import (
    PreviewDayCell,
    PreviewHalfCell,
    PreviewWorkerBlock,
    SchedulePreview,
)

router = APIRouter(
    prefix="/schedules",
    tags=["schedules"],
    dependencies=[Depends(verify_internal_api_key)],
)


def _preview_from_json(raw: dict[str, object]) -> SchedulePreview:
    workers: list[PreviewWorkerBlock] = []
    for worker_raw in raw.get("workers", []):
        if not isinstance(worker_raw, dict):
            continue
        rows: list[list[PreviewDayCell]] = []
        for row_raw in worker_raw.get("rows", []):
            if not isinstance(row_raw, list):
                continue
            row: list[PreviewDayCell] = []
            for cell_raw in row_raw:
                if not isinstance(cell_raw, dict):
                    row.append(PreviewDayCell())
                    continue
                start_raw = cell_raw.get("start", {})
                end_raw = cell_raw.get("end", {})
                row.append(
                    PreviewDayCell(
                        start=PreviewHalfCell(
                            text=start_raw.get("text") if isinstance(start_raw, dict) else None,
                            fill=start_raw.get("fill", "none")
                            if isinstance(start_raw, dict)
                            else "none",
                        ),
                        end=PreviewHalfCell(
                            text=end_raw.get("text") if isinstance(end_raw, dict) else None,
                            fill=end_raw.get("fill", "none")
                            if isinstance(end_raw, dict)
                            else "none",
                        ),
                    )
                )
            rows.append(row)
        workers.append(
            PreviewWorkerBlock(
                worker_id=str(worker_raw.get("workerId", "")),
                first_name=str(worker_raw.get("firstName", "")),
                last_name=str(worker_raw.get("lastName", "")),
                rows=rows,
            )
        )

    return SchedulePreview(
        year=int(raw["year"]),
        month=int(raw["month"]),
        days_in_month=int(raw["daysInMonth"]),
        weekdays=[str(item) for item in raw["weekdays"]],
        day_numbers=[int(item) for item in raw["dayNumbers"]],
        workers=workers,
    )


@router.post("/generate", response_model=GenerateScheduleResponse)
def generate_schedule(
    _settings: SettingsDep,
    payload: GenerateScheduleRequest,
) -> GenerateScheduleResponse:
    return ScheduleGeneratorService().generate(payload)


@router.post("/export/pdf", response_model=ExportGrafikPdfResponse)
def export_grafik_pdf(
    _settings: SettingsDep,
    payload: ExportGrafikPdfRequest,
) -> ExportGrafikPdfResponse:
    preview = _preview_from_json(payload.preview)
    pdf_bytes = render_grafik_pdf(preview)
    file_name = f"GRAFIK {preview.month:02d}.{preview.year}.pdf"
    return ExportGrafikPdfResponse(
        file_name=file_name,
        content_base64=base64.b64encode(pdf_bytes).decode("ascii"),
    )
