"""Synthetic podkład availability for dev / testing (no xlsx file required)."""

from __future__ import annotations

import hashlib

from scheduler_engine.schemas.schedule_generate import WorkerPayload
from scheduler_engine.services.podklad_colors import FillKind
from scheduler_engine.services.podklad_generator import get_days_in_month
from scheduler_engine.services.podklad_parser import DayDisposition, ParsedWorkerDraft, WorkerRole
from scheduler_engine.services.time_range import TimeRange

MORNING_RANGE: TimeRange = ("08:00", "15:15")
AFTERNOON_RANGE: TimeRange = ("15:00", "22:00")
FULL_DAY_RANGE: TimeRange = ("08:00", "22:00")


def _worker_seed(worker_id: str) -> int:
    digest = hashlib.sha256(worker_id.encode()).hexdigest()
    return int(digest[:8], 16)


def build_mock_day_dispositions(
    *,
    worker_id: str,
    year: int,
    month: int,
) -> list[DayDisposition]:
    days_in_month = get_days_in_month(year, month)
    seed = _worker_seed(worker_id)
    result: list[DayDisposition] = []

    for day in range(1, days_in_month + 1):
        date = f"{year}-{month:02d}-{day:02d}"
        weekday = (seed + day) % 7  # pseudo weekday offset

        # ~1/7 days off
        if (seed + day * 3) % 11 == 0:
            result.append(DayDisposition(date=date))
            continue

        pattern = (seed + day) % 5
        morning_color: FillKind = "none"
        afternoon_color: FillKind = "none"
        ranges: list[TimeRange] = []

        if pattern == 0:
            morning_color = "yellow"
            afternoon_color = "purple"
            ranges = [MORNING_RANGE, AFTERNOON_RANGE]
        elif pattern == 1:
            morning_color = "yellow"
            ranges = [MORNING_RANGE]
        elif pattern == 2:
            afternoon_color = "purple"
            ranges = [AFTERNOON_RANGE]
        elif pattern == 3:
            morning_color = "yellow"
            afternoon_color = "purple"
            ranges = [FULL_DAY_RANGE]
        else:
            if weekday % 2 == 0:
                morning_color = "yellow"
                ranges = [MORNING_RANGE]
            else:
                afternoon_color = "purple"
                ranges = [AFTERNOON_RANGE]

        result.append(
            DayDisposition(
                date=date,
                ranges=ranges,
                morning_color=morning_color,
                afternoon_color=afternoon_color,
            )
        )

    return result


def build_mock_parsed_worker(
    worker: WorkerPayload,
    *,
    year: int,
    month: int,
) -> ParsedWorkerDraft:
    role: WorkerRole = worker.role
    return ParsedWorkerDraft(
        worker_id=worker.id,
        draft_id=f"mock-draft-{worker.id}",
        file_name=f"MOCK-PODKLAD-{worker.last_name}-{worker.first_name}.xlsx",
        first_name=worker.first_name,
        last_name=worker.last_name,
        role=role,
        year=year,
        month=month,
        available_as_worker=worker.available_as_worker,
        days=build_mock_day_dispositions(worker_id=worker.id, year=year, month=month),
    )
