from scheduler_engine.services.podklad_parser import DayDisposition, ParsedWorkerDraft
from scheduler_engine.services.schedule_solver import ShiftSlot, solve_schedule


def _worker(
    worker_id: str,
    role: str,
    days: list[DayDisposition],
    *,
    available_as_worker: bool = True,
) -> ParsedWorkerDraft:
    return ParsedWorkerDraft(
        worker_id=worker_id,
        draft_id=f"draft-{worker_id}",
        file_name=f"{worker_id}.xlsx",
        first_name="Jan",
        last_name=worker_id,
        role=role,  # type: ignore[arg-type]
        year=2026,
        month=6,
        available_as_worker=available_as_worker,
        days=days,
    )


def test_solver_assigns_available_workers_to_shift_slots() -> None:
    workers = [
        _worker(
            "1",
            "worker",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "15:15")])],
        ),
        _worker(
            "2",
            "worker",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "15:15")])],
        ),
        _worker(
            "3",
            "boss",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "22:00")])],
        ),
    ]

    slots = [
        ShiftSlot(
            slot_id="slot-worker-1",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=0,
            role="worker",
            start="08:00",
            end="15:15",
        ),
        ShiftSlot(
            slot_id="slot-worker-2",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=0,
            role="worker",
            start="08:00",
            end="15:15",
        ),
        ShiftSlot(
            slot_id="slot-boss-1",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=1,
            role="boss",
            start="08:00",
            end="15:15",
        ),
    ]

    result = solve_schedule(workers, slots)

    assert result.status in {"optimal", "feasible"}
    assert len(result.assignments) == 3
    assert result.unassigned_slot_ids == []

    boss_assignment = next(item for item in result.assignments if item.role == "boss")
    assert boss_assignment.worker_id == "3"
    assert boss_assignment.role == "boss"


def test_boss_prefers_boss_slot_over_worker_slot() -> None:
    workers = [
        _worker(
            "boss-1",
            "boss",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "22:00")])],
        ),
        _worker(
            "worker-1",
            "worker",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "15:15")])],
        ),
    ]

    slots = [
        ShiftSlot(
            slot_id="slot-worker",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=0,
            role="worker",
            start="08:00",
            end="15:15",
        ),
        ShiftSlot(
            slot_id="slot-boss",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=1,
            role="boss",
            start="08:00",
            end="15:15",
        ),
    ]

    result = solve_schedule(workers, slots)

    assert result.status in {"optimal", "feasible"}
    boss_assignment = next(item for item in result.assignments if item.role == "boss")
    assert boss_assignment.worker_id == "boss-1"
    worker_assignment = next(item for item in result.assignments if item.role == "worker")
    assert worker_assignment.worker_id == "worker-1"


def test_boss_can_fill_worker_slot_when_no_worker_available() -> None:
    workers = [
        _worker(
            "boss-1",
            "boss",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "22:00")])],
        ),
        _worker(
            "boss-2",
            "boss",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "22:00")])],
        ),
    ]

    slots = [
        ShiftSlot(
            slot_id="slot-worker",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=0,
            role="worker",
            start="08:00",
            end="15:15",
        ),
        ShiftSlot(
            slot_id="slot-boss",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=1,
            role="boss",
            start="08:00",
            end="15:15",
        ),
    ]

    result = solve_schedule(workers, slots)

    assert result.status in {"optimal", "feasible"}
    assert len(result.assignments) == 2
    boss_assignment = next(item for item in result.assignments if item.role == "boss")
    worker_assignment = next(item for item in result.assignments if item.role == "worker")
    assert boss_assignment.worker_id in {"boss-1", "boss-2"}
    assert worker_assignment.worker_id in {"boss-1", "boss-2"}
    assert boss_assignment.worker_id != worker_assignment.worker_id


def test_full_day_availability_prefers_standard_half_day_shift() -> None:
    workers = [
        _worker(
            "worker-1",
            "worker",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "22:00")])],
        ),
        _worker(
            "worker-2",
            "worker",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "22:00")])],
        ),
    ]

    slots = [
        ShiftSlot(
            slot_id="slot-morning",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=0,
            role="worker",
            start="08:00",
            end="15:15",
        ),
        ShiftSlot(
            slot_id="slot-long",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=0,
            role="worker",
            start="10:00",
            end="20:00",
        ),
    ]

    result = solve_schedule(workers, slots)

    assert result.status in {"optimal", "feasible"}
    assert len(result.assignments) == 2
    shift_times = {(item.start, item.end) for item in result.assignments}
    assert ("08:00", "15:15") in shift_times
    assert ("10:00", "20:00") in shift_times


def test_full_day_worker_can_take_long_shift_when_only_option() -> None:
    workers = [
        _worker(
            "worker-1",
            "worker",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "22:00")])],
        ),
    ]

    slots = [
        ShiftSlot(
            slot_id="slot-long",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=0,
            role="worker",
            start="10:00",
            end="20:00",
        ),
    ]

    result = solve_schedule(workers, slots)

    assert result.status in {"optimal", "feasible"}
    assert len(result.assignments) == 1
    assert result.assignments[0].start == "10:00"
    assert result.assignments[0].end == "20:00"


def test_boss_with_available_as_worker_false_cannot_take_worker_slot() -> None:
    workers = [
        _worker(
            "boss-1",
            "boss",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "22:00")])],
            available_as_worker=False,
        ),
    ]

    slots = [
        ShiftSlot(
            slot_id="slot-worker",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=0,
            role="worker",
            start="08:00",
            end="15:15",
        ),
        ShiftSlot(
            slot_id="slot-boss",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=1,
            role="boss",
            start="08:00",
            end="15:15",
        ),
    ]

    result = solve_schedule(workers, slots)

    assert result.status == "infeasible"
    assert len(result.assignments) == 1
    assert result.assignments[0].role == "boss"
    assert "slot-worker" in result.unassigned_slot_ids


def test_boss_with_available_as_worker_true_can_take_worker_slot() -> None:
    workers = [
        _worker(
            "boss-1",
            "boss",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "22:00")])],
            available_as_worker=True,
        ),
        _worker(
            "boss-2",
            "boss",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "22:00")])],
            available_as_worker=False,
        ),
    ]

    slots = [
        ShiftSlot(
            slot_id="slot-worker",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=0,
            role="worker",
            start="08:00",
            end="15:15",
        ),
        ShiftSlot(
            slot_id="slot-boss",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=1,
            role="boss",
            start="08:00",
            end="15:15",
        ),
    ]

    result = solve_schedule(workers, slots)

    assert result.status in {"optimal", "feasible"}
    worker_assignment = next(item for item in result.assignments if item.role == "worker")
    boss_assignment = next(item for item in result.assignments if item.role == "boss")
    assert worker_assignment.worker_id == "boss-1"
    assert boss_assignment.worker_id == "boss-2"


def test_solve_schedule_persists_debug_files(tmp_path, monkeypatch) -> None:
    import json

    monkeypatch.setattr(
        "scheduler_engine.services.schedule_solver._SOLVER_TMP_DIR",
        tmp_path,
    )

    workers = [
        _worker(
            "mock-1",
            "worker",
            [DayDisposition(date="2026-06-02", ranges=[("08:00", "15:15")])],
        ),
    ]
    slots = [
        ShiftSlot(
            slot_id="slot-worker-1",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=0,
            role="worker",
            start="08:00",
            end="15:15",
        ),
    ]

    solve_schedule(workers, slots, mock_worker_drafts=True)

    request_files = sorted(tmp_path.glob("request_*.json"))
    response_files = sorted(tmp_path.glob("response_*.json"))
    assert len(request_files) == 1
    assert len(response_files) == 1

    request_data = json.loads(request_files[0].read_text(encoding="utf-8"))
    response_data = json.loads(response_files[0].read_text(encoding="utf-8"))

    assert request_data["mockWorkerDrafts"] is True
    assert request_data["workers"][0]["workerId"] == "mock-1"
    assert response_data["status"] in {"optimal", "feasible", "infeasible"}
    assert request_files[0].stem.split("_", 1)[1] == response_files[0].stem.split("_", 1)[1]


def test_solver_keeps_fillable_slots_when_some_have_no_candidates() -> None:
    workers = [
        _worker(
            "1",
            "worker",
            [
                DayDisposition(date="2026-06-02", ranges=[("08:00", "15:15")]),
                DayDisposition(date="2026-06-03", ranges=[]),
            ],
        ),
        _worker(
            "boss-1",
            "boss",
            [
                DayDisposition(date="2026-06-02", ranges=[("08:00", "22:00")]),
                DayDisposition(date="2026-06-03", ranges=[]),
                DayDisposition(date="2026-06-04", ranges=[]),
            ],
            available_as_worker=False,
        ),
    ]

    slots = [
        ShiftSlot(
            slot_id="slot-worker-ok",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=0,
            role="worker",
            start="08:00",
            end="15:15",
        ),
        ShiftSlot(
            slot_id="slot-worker-impossible",
            date="2026-06-03",
            shift_template_id="tpl-1",
            shift_index=0,
            role="worker",
            start="08:00",
            end="15:15",
        ),
        ShiftSlot(
            slot_id="slot-boss-ok",
            date="2026-06-02",
            shift_template_id="tpl-1",
            shift_index=1,
            role="boss",
            start="08:00",
            end="15:15",
        ),
        ShiftSlot(
            slot_id="slot-boss-impossible",
            date="2026-06-04",
            shift_template_id="tpl-1",
            shift_index=1,
            role="boss",
            start="08:00",
            end="15:15",
        ),
    ]

    result = solve_schedule(workers, slots)

    assert result.status == "infeasible"
    assigned_keys = {(item.date, item.role) for item in result.assignments}
    assert ("2026-06-02", "worker") in assigned_keys
    assert ("2026-06-02", "boss") in assigned_keys
    assert "slot-worker-impossible" in result.unassigned_slot_ids
    assert "slot-boss-impossible" in result.unassigned_slot_ids
    assert "slot-worker-ok" not in result.unassigned_slot_ids
    assert "slot-boss-ok" not in result.unassigned_slot_ids
    assert len(result.assignments) == 2
