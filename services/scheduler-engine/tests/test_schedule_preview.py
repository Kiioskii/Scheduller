from scheduler_engine.services.podklad_parser import DayDisposition
from scheduler_engine.services.schedule_preview import build_schedule_preview
from scheduler_engine.services.schedule_solver import ScheduleAssignment


def _worker(worker_id: str, first: str, last: str, days: list[DayDisposition]):
    from scheduler_engine.services.podklad_parser import ParsedWorkerDraft

    return ParsedWorkerDraft(
        worker_id=worker_id,
        draft_id=f"draft-{worker_id}",
        file_name=f"{worker_id}.xlsx",
        first_name=first,
        last_name=last,
        role="worker",
        year=2026,
        month=5,
        days=days,
    )


def test_build_schedule_preview_shows_assignment_times() -> None:
    workers = [
        _worker(
            "1",
            "Jan",
            "Kowalski",
            [
                DayDisposition(
                    date="2026-05-02",
                    ranges=[("08:00", "15:15")],
                    morning_color="yellow",
                    afternoon_color="none",
                )
            ],
        )
    ]
    assignments = [
        ScheduleAssignment(
            date="2026-05-02",
            shift_template_id="tpl-1",
            shift_index=0,
            worker_id="1",
            role="worker",
            start="08:00",
            end="15:15",
        )
    ]

    preview = build_schedule_preview(
        year=2026,
        month=5,
        parsed_workers=workers,
        assignments=assignments,
    )

    assert preview.days_in_month == 31
    assert preview.workers[0].last_name == "Kowalski"
    cell = preview.workers[0].rows[0][1]
    assert cell.start.text == "8,00"
    assert cell.end.text == "15,15"
    assert cell.start.fill == "none"


def test_build_schedule_preview_shows_availability_colors_without_assignment() -> None:
    workers = [
        _worker(
            "1",
            "Anna",
            "Nowak",
            [
                DayDisposition(
                    date="2026-05-03",
                    ranges=[("08:00", "15:15"), ("15:00", "22:00")],
                    morning_color="yellow",
                    afternoon_color="purple",
                )
            ],
        )
    ]

    preview = build_schedule_preview(
        year=2026,
        month=5,
        parsed_workers=workers,
        assignments=[],
    )

    cell = preview.workers[0].rows[0][2]
    assert cell.start.text is None
    assert cell.end.text is None
    assert cell.start.fill == "yellow"
    assert cell.end.fill == "purple"
