from scheduler_engine.services.mock_worker_draft import (
    build_mock_day_dispositions,
    build_mock_parsed_worker,
)
from scheduler_engine.schemas.schedule_generate import WorkerPayload


def test_build_mock_day_dispositions_varies_by_worker() -> None:
    worker_a = build_mock_day_dispositions(worker_id="1", year=2026, month=6)
    worker_b = build_mock_day_dispositions(worker_id="2", year=2026, month=6)

    assert len(worker_a) == 30
    assert len(worker_b) == 30
    assert worker_a != worker_b

    available_a = sum(1 for day in worker_a if day.available)
    available_b = sum(1 for day in worker_b if day.available)
    assert available_a > 10
    assert available_b > 10


def test_build_mock_parsed_worker_uses_worker_metadata() -> None:
    worker = WorkerPayload(
        id="42",
        firstName="Anna",
        lastName="Nowak",
        role="worker",
        priority=5,
        checker=False,
        availableAsWorker=True,
        deleted=False,
    )

    parsed = build_mock_parsed_worker(worker, year=2026, month=6)

    assert parsed.worker_id == "42"
    assert parsed.first_name == "Anna"
    assert parsed.last_name == "Nowak"
    assert parsed.draft_id == "mock-draft-42"
    assert len(parsed.days) == 30
    assert any(day.morning_color == "yellow" for day in parsed.days)
