"""Synthetic podkład availability for dev / testing (no xlsx file required)."""

from __future__ import annotations

import hashlib
from datetime import date

from scheduler_engine.schemas.schedule_generate import WorkerPayload
from scheduler_engine.services.podklad_colors import FillKind
from scheduler_engine.services.podklad_generator import get_days_in_month
from scheduler_engine.services.podklad_parser import DayDisposition, ParsedWorkerDraft, WorkerRole
from scheduler_engine.services.time_range import TimeRange

MORNING_RANGE: TimeRange = ("08:00", "15:15")
AFTERNOON_RANGE: TimeRange = ("15:00", "22:00")
FULL_DAY_RANGE: TimeRange = ("08:00", "22:00")

# Compact mock dataset — easier to inspect solver request/response dumps.
MOCK_MAX_WORKERS = 10
MOCK_DAYS = 7
MOCK_MAX_REQUIRED_WORKERS = 4


def _worker_seed(worker_id: str) -> int:
    digest = hashlib.sha256(worker_id.encode()).hexdigest()
    return int(digest[:8], 16)


def _expand_boss_availability_ranges(ranges: list[TimeRange]) -> list[TimeRange]:
    """Bosses start earlier / finish later than the default mock windows."""
    expanded: list[TimeRange] = []
    for start, end in ranges:
        new_start = "07:00" if start == "08:00" else start
        if end == "22:00":
            new_end = "23:00"
        elif end == "15:15":
            new_end = "15:30"
        else:
            new_end = end
        expanded.append((new_start, new_end))
    return expanded


def _expand_worker_availability_ranges(ranges: list[TimeRange]) -> list[TimeRange]:
    """Workers can start earlier than the default mock morning window."""
    return [("07:00" if start == "08:00" else start, end) for start, end in ranges]


def select_mock_workers(workers: list[WorkerPayload]) -> list[WorkerPayload]:
    """Prefer bosses, then workers — cap at MOCK_MAX_WORKERS for compact dumps."""
    active = [worker for worker in workers if not worker.deleted]
    bosses = [worker for worker in active if worker.role == "boss"]
    regular = [worker for worker in active if worker.role != "boss"]
    bosses.sort(key=lambda item: (item.last_name.casefold(), item.first_name.casefold()))
    regular.sort(key=lambda item: (item.last_name.casefold(), item.first_name.casefold()))

    selected = bosses[:MOCK_MAX_WORKERS]
    remaining = MOCK_MAX_WORKERS - len(selected)
    if remaining > 0:
        selected.extend(regular[:remaining])
    return selected


def is_mock_schedule_iso_date(value: str, *, year: int, month: int) -> bool:
    try:
        parsed = date.fromisoformat(value)
    except ValueError:
        return False
    days_in_month = get_days_in_month(year, month)
    return (
        parsed.year == year
        and parsed.month == month
        and 1 <= parsed.day <= min(MOCK_DAYS, days_in_month)
    )


def mock_required_workers(role: WorkerRole, required_workers: int) -> int:
    if role == "worker":
        return min(required_workers, MOCK_MAX_REQUIRED_WORKERS)
    return required_workers


def build_mock_day_dispositions(
    *,
    worker_id: str,
    year: int,
    month: int,
    role: WorkerRole = "worker",
) -> list[DayDisposition]:
    days_in_month = get_days_in_month(year, month)
    day_limit = min(MOCK_DAYS, days_in_month)
    seed = _worker_seed(worker_id)
    result: list[DayDisposition] = []

    for day in range(1, day_limit + 1):
        day_date = f"{year}-{month:02d}-{day:02d}"
        weekday = (seed + day) % 7  # pseudo weekday offset

        # Sparse days off — keep most of the short mock week usable.
        if (seed + day * 3) % 13 == 0:
            result.append(DayDisposition(date=day_date))
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

        if role == "boss":
            ranges = _expand_boss_availability_ranges(ranges)
        else:
            ranges = _expand_worker_availability_ranges(ranges)

        result.append(
            DayDisposition(
                date=day_date,
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
        days=build_mock_day_dispositions(
            worker_id=worker.id,
            year=year,
            month=month,
            role=role,
        ),
    )
