from scheduler_engine.services.mock_worker_draft import (
    MOCK_DAYS,
    MOCK_MAX_WORKERS,
    build_mock_day_dispositions,
    build_mock_parsed_worker,
    select_mock_workers,
)
from scheduler_engine.schemas.schedule_generate import WorkerPayload


def _worker(
    worker_id: str,
    *,
    role: str = "worker",
    last_name: str | None = None,
) -> WorkerPayload:
    return WorkerPayload(
        id=worker_id,
        firstName="Jan",
        lastName=last_name or worker_id,
        role=role,  # type: ignore[arg-type]
        priority=5,
        checker=False,
        availableAsWorker=True,
        deleted=False,
    )


def test_build_mock_day_dispositions_varies_by_worker() -> None:
    worker_a = build_mock_day_dispositions(worker_id="1", year=2026, month=6)
    worker_b = build_mock_day_dispositions(worker_id="2", year=2026, month=6)

    assert len(worker_a) == MOCK_DAYS
    assert len(worker_b) == MOCK_DAYS
    assert worker_a != worker_b

    available_a = sum(1 for day in worker_a if day.available)
    available_b = sum(1 for day in worker_b if day.available)
    assert available_a >= 4
    assert available_b >= 4


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
    assert len(parsed.days) == MOCK_DAYS
    assert any(day.morning_color == "yellow" for day in parsed.days)


def test_boss_mock_availability_expands_end_times() -> None:
    boss_days = build_mock_day_dispositions(worker_id="boss-1", year=2026, month=6, role="boss")

    assert any(day.ranges for day in boss_days)
    for day in boss_days:
        for start, end in day.ranges:
            assert start != "08:00"
            assert end != "15:15"
            assert end != "22:00"

    assert any(end == "15:30" for day in boss_days for _, end in day.ranges)
    assert any(end == "23:00" for day in boss_days for _, end in day.ranges)
    assert any(start == "07:00" for day in boss_days for start, _ in day.ranges)

    boss = WorkerPayload(
        id="boss-1",
        firstName="Piotr",
        lastName="Szef",
        role="boss",
        priority=1,
        checker=False,
        availableAsWorker=True,
        deleted=False,
    )
    parsed = build_mock_parsed_worker(boss, year=2026, month=6)
    assert len(parsed.days) == MOCK_DAYS
    assert any(end == "15:30" for day in parsed.days for _, end in day.ranges)


def test_worker_mock_availability_starts_at_07() -> None:
    worker_days = build_mock_day_dispositions(worker_id="42", year=2026, month=6, role="worker")

    morningish = [
        (start, end)
        for day in worker_days
        for start, end in day.ranges
        if start in {"07:00", "08:00"} or end == "15:15"
    ]
    assert morningish
    assert all(start != "08:00" for start, _ in morningish)
    assert any(start == "07:00" for start, _ in morningish)
    assert any(end == "15:15" for _, end in morningish)


def test_select_mock_workers_prefers_bosses_and_caps_count() -> None:
    workers = [
        *[_worker(f"b{i}", role="boss", last_name=f"Boss{i}") for i in range(3)],
        *[_worker(f"w{i}", role="worker", last_name=f"Worker{i}") for i in range(15)],
    ]

    selected = select_mock_workers(workers)
    assert len(selected) == MOCK_MAX_WORKERS
    assert sum(1 for worker in selected if worker.role == "boss") == 3
    assert sum(1 for worker in selected if worker.role == "worker") == 7
