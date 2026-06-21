"""Build schedule preview grid (grafik layout) from solver output and podkład availability."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from scheduler_engine.services.podklad_colors import FillKind
from scheduler_engine.services.podklad_generator import get_days_in_month, weekday_label
from scheduler_engine.services.podklad_parser import DayDisposition, ParsedWorkerDraft
from scheduler_engine.services.schedule_solver import ScheduleAssignment

PreviewFill = Literal["none", "yellow", "purple"]


@dataclass(slots=True)
class PreviewHalfCell:
    text: str | None = None
    fill: PreviewFill = "none"

    def to_json(self) -> dict[str, object]:
        return {"text": self.text, "fill": self.fill}


@dataclass(slots=True)
class PreviewDayCell:
    start: PreviewHalfCell = field(default_factory=PreviewHalfCell)
    end: PreviewHalfCell = field(default_factory=PreviewHalfCell)

    def to_json(self) -> dict[str, object]:
        return {"start": self.start.to_json(), "end": self.end.to_json()}


@dataclass(slots=True)
class PreviewWorkerBlock:
    worker_id: str
    first_name: str
    last_name: str
    rows: list[list[PreviewDayCell]] = field(default_factory=list)

    def to_json(self) -> dict[str, object]:
        return {
            "workerId": self.worker_id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "rows": [[cell.to_json() for cell in row] for row in self.rows],
        }


@dataclass(slots=True)
class SchedulePreview:
    year: int
    month: int
    days_in_month: int
    weekdays: list[str]
    day_numbers: list[int]
    workers: list[PreviewWorkerBlock] = field(default_factory=list)

    def to_json(self) -> dict[str, object]:
        return {
            "year": self.year,
            "month": self.month,
            "daysInMonth": self.days_in_month,
            "weekdays": self.weekdays,
            "dayNumbers": self.day_numbers,
            "workers": [worker.to_json() for worker in self.workers],
        }


def format_time_polish(value: str) -> str:
    hour_str, minute_str = value.split(":", 1)
    return f"{int(hour_str)},{minute_str}"


def _preview_fill(kind: FillKind) -> PreviewFill:
    if kind == "yellow":
        return "yellow"
    if kind == "purple":
        return "purple"
    return "none"


def _assignments_by_worker_date(
    assignments: list[ScheduleAssignment],
) -> dict[tuple[str, str], list[ScheduleAssignment]]:
    grouped: dict[tuple[str, str], list[ScheduleAssignment]] = {}
    for assignment in assignments:
        key = (assignment.worker_id, assignment.date)
        grouped.setdefault(key, []).append(assignment)

    for key in grouped:
        grouped[key].sort(key=lambda item: (item.start, item.end, item.shift_index))

    return grouped


def _availability_by_date(days: list[DayDisposition]) -> dict[str, DayDisposition]:
    return {day.date: day for day in days}


def _empty_day_row(days_in_month: int, year: int, month: int) -> list[PreviewDayCell]:
    return [PreviewDayCell() for _ in range(days_in_month)]


def _apply_availability(
    row: list[PreviewDayCell],
    day_index: int,
    disposition: DayDisposition | None,
) -> None:
    if disposition is None or not disposition.available:
        return

    cell = row[day_index]
    if cell.start.text is None and disposition.morning_color != "none":
        cell.start.fill = _preview_fill(disposition.morning_color)
    if cell.end.text is None and disposition.afternoon_color != "none":
        cell.end.fill = _preview_fill(disposition.afternoon_color)


def build_schedule_preview(
    *,
    year: int,
    month: int,
    parsed_workers: list[ParsedWorkerDraft],
    assignments: list[ScheduleAssignment],
) -> SchedulePreview:
    days_in_month = get_days_in_month(year, month)
    weekdays = [weekday_label(year, month, day) for day in range(1, days_in_month + 1)]
    day_numbers = list(range(1, days_in_month + 1))

    assignments_index = _assignments_by_worker_date(assignments)
    sorted_workers = sorted(
        parsed_workers,
        key=lambda worker: (worker.last_name.casefold(), worker.first_name.casefold()),
    )

    worker_blocks: list[PreviewWorkerBlock] = []

    for worker in sorted_workers:
        availability = _availability_by_date(worker.days)
        max_rows = 1

        for day in range(1, days_in_month + 1):
            date = f"{year}-{month:02d}-{day:02d}"
            count = len(assignments_index.get((worker.worker_id, date), []))
            max_rows = max(max_rows, count)

        rows: list[list[PreviewDayCell]] = []
        for row_index in range(max_rows):
            row = _empty_day_row(days_in_month, year, month)
            for day in range(1, days_in_month + 1):
                date = f"{year}-{month:02d}-{day:02d}"
                day_assignments = assignments_index.get((worker.worker_id, date), [])

                if row_index < len(day_assignments):
                    assignment = day_assignments[row_index]
                    row[day - 1].start.text = format_time_polish(assignment.start)
                    row[day - 1].end.text = format_time_polish(assignment.end)
                elif row_index == 0:
                    _apply_availability(row, day - 1, availability.get(date))

            rows.append(row)

        worker_blocks.append(
            PreviewWorkerBlock(
                worker_id=worker.worker_id,
                first_name=worker.first_name,
                last_name=worker.last_name,
                rows=rows,
            )
        )

    return SchedulePreview(
        year=year,
        month=month,
        days_in_month=days_in_month,
        weekdays=weekdays,
        day_numbers=day_numbers,
        workers=worker_blocks,
    )
