"""CP-SAT schedule solver powered by Google OR-Tools."""

from __future__ import annotations

import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from ortools.sat.python import cp_model

from scheduler_engine.services.podklad_parser import ParsedWorkerDraft
from scheduler_engine.services.time_range import (
    TimeRange,
    has_full_day_availability,
    is_standard_half_day_shift,
    shift_contained_in_ranges,
)

WorkerRole = Literal["worker", "boss"]

BOSS_AS_WORKER_PENALTY = 1_000
FULL_DAY_NON_STANDARD_PENALTY = 100

_SOLVER_TMP_DIR = Path(__file__).resolve().parents[3] / "tmp"


@dataclass(slots=True)
class ShiftSlot:
    slot_id: str
    date: str
    shift_template_id: str
    shift_index: int
    role: WorkerRole
    start: str
    end: str

    def to_json(self) -> dict[str, object]:
        return {
            "slotId": self.slot_id,
            "date": self.date,
            "shiftTemplateId": self.shift_template_id,
            "shiftIndex": self.shift_index,
            "role": self.role,
            "start": self.start,
            "end": self.end,
        }


@dataclass(slots=True)
class ScheduleAssignment:
    date: str
    shift_template_id: str
    shift_index: int
    worker_id: str
    role: WorkerRole
    start: str
    end: str

    def to_json(self) -> dict[str, object]:
        return {
            "date": self.date,
            "shiftTemplateId": self.shift_template_id,
            "shiftIndex": self.shift_index,
            "workerId": self.worker_id,
            "role": self.role,
            "start": self.start,
            "end": self.end,
        }


@dataclass(slots=True)
class SolverResult:
    status: Literal["optimal", "feasible", "infeasible"]
    assignments: list[ScheduleAssignment]
    unassigned_slot_ids: list[str]

    def to_json(self) -> dict[str, object]:
        return {
            "status": self.status,
            "assignments": [assignment.to_json() for assignment in self.assignments],
            "unassignedSlotIds": self.unassigned_slot_ids,
        }


def _build_solver_request_payload(
    workers: list[ParsedWorkerDraft],
    slots: list[ShiftSlot],
    *,
    mock_worker_drafts: bool = False,
) -> dict[str, object]:
    return {
        "mockWorkerDrafts": mock_worker_drafts,
        "workers": [worker.to_json() for worker in workers],
        "slots": [slot.to_json() for slot in slots],
    }


def _persist_solver_debug_files(
    timestamp: int,
    workers: list[ParsedWorkerDraft],
    slots: list[ShiftSlot],
    result: SolverResult,
    *,
    mock_worker_drafts: bool = False,
) -> None:
    _SOLVER_TMP_DIR.mkdir(parents=True, exist_ok=True)
    request_path = _SOLVER_TMP_DIR / f"request_{timestamp}.json"
    response_path = _SOLVER_TMP_DIR / f"response_{timestamp}.json"

    request_path.write_text(
        json.dumps(
            _build_solver_request_payload(workers, slots, mock_worker_drafts=mock_worker_drafts),
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    response_path.write_text(
        json.dumps(result.to_json(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def solve_schedule(
    workers: list[ParsedWorkerDraft],
    slots: list[ShiftSlot],
    *,
    mock_worker_drafts: bool = False,
) -> SolverResult:
    timestamp = int(time.time())
    result = _run_schedule_solver(workers, slots)
    _persist_solver_debug_files(
        timestamp,
        workers,
        slots,
        result,
        mock_worker_drafts=mock_worker_drafts,
    )
    return result


def _run_schedule_solver(
    workers: list[ParsedWorkerDraft],
    slots: list[ShiftSlot],
) -> SolverResult:
    if not slots:
        return SolverResult(status="optimal", assignments=[], unassigned_slot_ids=[])

    if not workers:
        print("HERE JEST PROBLEM - workers")
        return SolverResult(
            status="infeasible",
            assignments=[],
            unassigned_slot_ids=[slot.slot_id for slot in slots],
        )

    availability = _build_availability_index(workers)
    boss_slots = [slot for slot in slots if slot.role == "boss"]
    worker_slots = [slot for slot in slots if slot.role == "worker"]

    boss_result = _solve_slot_group(
        workers=workers,
        slots=boss_slots,
        availability=availability,
        busy_workers=set(),
        bosses_only=True,
    )

    busy_workers = {(assignment.worker_id, assignment.date) for assignment in boss_result.assignments}
    worker_result = _solve_slot_group(
        workers=workers,
        slots=worker_slots,
        availability=availability,
        busy_workers=busy_workers,
        bosses_only=False,
    )

    assignments = boss_result.assignments + worker_result.assignments
    unassigned = boss_result.unassigned_slot_ids + worker_result.unassigned_slot_ids
    if unassigned:
        print("HERE JEST PROBLEM - boss")
        return SolverResult(
            status="infeasible",
            assignments=assignments,
            unassigned_slot_ids=unassigned,
        )

    solver_status: Literal["optimal", "feasible"] = (
        "optimal"
        if boss_result.status == "optimal" and worker_result.status == "optimal"
        else "feasible"
    )
    return SolverResult(
        status=solver_status,
        assignments=assignments,
        unassigned_slot_ids=[],
    )


def _solve_slot_group(
    *,
    workers: list[ParsedWorkerDraft],
    slots: list[ShiftSlot],
    availability: dict[tuple[str, str], list[TimeRange]],
    busy_workers: set[tuple[str, str]],
    bosses_only: bool,
) -> SolverResult:
    if not slots:
        return SolverResult(status="optimal", assignments=[], unassigned_slot_ids=[])

    model = cp_model.CpModel()
    assign_vars: dict[tuple[str, str], cp_model.IntVar] = {}
    objective_terms: list[cp_model.LinearExpr] = []

    for worker in workers:
        for slot in slots:
            if (worker.worker_id, slot.date) in busy_workers:
                continue
            if not _worker_can_take_slot(worker, slot, availability, bosses_only=bosses_only):
                continue

            var_name = f"w_{worker.worker_id}__s_{slot.slot_id}"
            assign_var = model.new_bool_var(var_name)
            assign_vars[(worker.worker_id, slot.slot_id)] = assign_var
            objective_terms.append(
                assign_var * _assignment_preference_cost(worker, slot, availability)
            )

    impossible_slot_ids: list[str] = []
    solvable_slots: list[ShiftSlot] = []

    for slot in slots:
        eligible = [assign_vars[key] for key in assign_vars if key[1] == slot.slot_id]

        if not eligible:
            impossible_slot_ids.append(slot.slot_id)
            continue
        solvable_slots.append(slot)
        model.add(sum(eligible) == 1)

    if not solvable_slots:
        print("HERE JEST PROBLEM")
        return SolverResult(
            status="infeasible",
            assignments=[],
            unassigned_slot_ids=impossible_slot_ids,
        )

    slots_by_date: dict[str, list[ShiftSlot]] = {}
    for slot in solvable_slots:
        slots_by_date.setdefault(slot.date, []).append(slot)

    for worker in workers:
        for date_slots in slots_by_date.values():
            day_vars = [
                assign_vars[(worker.worker_id, slot.slot_id)]
                for slot in date_slots
                if (worker.worker_id, slot.slot_id) in assign_vars
            ]
            if len(day_vars) > 1:
                model.add(sum(day_vars) <= 1)

    if objective_terms:
        model.minimize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0
    status = solver.solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        print("HERE JEST PROBLEM - model")
        return SolverResult(
            status="infeasible",
            assignments=[],
            unassigned_slot_ids=impossible_slot_ids + [slot.slot_id for slot in solvable_slots],
        )

    assignments: list[ScheduleAssignment] = []
    assigned_slot_ids: set[str] = set()

    for (worker_id, slot_id), var in assign_vars.items():
        if solver.value(var) != 1:
            continue
        slot = next(item for item in solvable_slots if item.slot_id == slot_id)
        assignments.append(
            ScheduleAssignment(
                date=slot.date,
                shift_template_id=slot.shift_template_id,
                shift_index=slot.shift_index,
                worker_id=worker_id,
                role=slot.role,
                start=slot.start,
                end=slot.end,
            )
        )
        assigned_slot_ids.add(slot_id)

    unassigned = impossible_slot_ids + [
        slot.slot_id for slot in solvable_slots if slot.slot_id not in assigned_slot_ids
    ]
    if unassigned:
        print("HERE JEST PROBLEM - assigned")
        return SolverResult(
            status="infeasible",
            assignments=assignments,
            unassigned_slot_ids=unassigned,
        )

    solver_status: Literal["optimal", "feasible"] = (
        "optimal" if status == cp_model.OPTIMAL else "feasible"
    )
    return SolverResult(
        status=solver_status,
        assignments=assignments,
        unassigned_slot_ids=[],
    )


def _assignment_preference_cost(
    worker: ParsedWorkerDraft,
    slot: ShiftSlot,
    availability: dict[tuple[str, str], list[TimeRange]],
) -> int:
    cost = 0
    if worker.role == "boss" and slot.role == "worker" and worker.available_as_worker:
        cost += BOSS_AS_WORKER_PENALTY

    day_ranges = availability.get((worker.worker_id, slot.date), [])
    if has_full_day_availability(day_ranges) and not is_standard_half_day_shift(
        slot.start, slot.end
    ):
        cost += FULL_DAY_NON_STANDARD_PENALTY

    return cost


def _build_availability_index(
    workers: list[ParsedWorkerDraft],
) -> dict[tuple[str, str], list[TimeRange]]:
    index: dict[tuple[str, str], list[TimeRange]] = {}
    for worker in workers:
        for day in worker.days:
            index[(worker.worker_id, day.date)] = day.ranges
    return index


def _worker_can_take_slot(
    worker: ParsedWorkerDraft,
    slot: ShiftSlot,
    availability: dict[tuple[str, str], list[TimeRange]],
    *,
    bosses_only: bool,
) -> bool:
    if bosses_only:
        if worker.role != "boss" or slot.role != "boss":
            return False
    elif slot.role == "boss":
        return False
    elif slot.role == "worker":
        if worker.role == "worker":
            pass
        elif worker.role == "boss":
            if not worker.available_as_worker:
                return False
        else:
            return False

    day_ranges = availability.get((worker.worker_id, slot.date))
    if not day_ranges:
        return False

    return shift_contained_in_ranges(slot.start, slot.end, day_ranges)
