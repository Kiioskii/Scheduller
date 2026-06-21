"""Orchestrates podkład parsing and OR-Tools schedule generation."""

from __future__ import annotations

from datetime import date
from typing import Literal
from uuid import uuid4

from scheduler_engine.schemas.schedule_generate import GenerateScheduleRequest, GenerateScheduleResponse
from scheduler_engine.services.mock_worker_draft import build_mock_parsed_worker
from scheduler_engine.services.podklad_parser import ParsedWorkerDraft, parse_worker_draft
from scheduler_engine.services.schedule_preview import build_schedule_preview
from scheduler_engine.services.schedule_solver import ShiftSlot, solve_schedule

WEEKDAY_NAMES = (
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
)


class ScheduleGeneratorService:
    def generate(self, payload: GenerateScheduleRequest) -> GenerateScheduleResponse:
        worker_roles = {worker.id: worker.role for worker in payload.workers}
        if payload.mock_worker_drafts:
            parsed_workers = self._build_mock_worker_drafts(payload)
        else:
            parsed_workers = self._parse_worker_drafts(payload, worker_roles)
        preview_workers = self._workers_for_preview(payload, parsed_workers)
        worker_table = [worker.to_json() for worker in parsed_workers]
        slots = self._build_shift_slots(payload)
        solver_result = solve_schedule(parsed_workers, slots)
        assignments = solver_result.assignments
        preview = build_schedule_preview(
            year=payload.year,
            month=payload.month,
            parsed_workers=preview_workers,
            assignments=assignments,
        )

        total_slot_count = len(slots)
        unassigned_count = len(solver_result.unassigned_slot_ids)

        status: Literal["completed", "failed"] = (
            "completed" if solver_result.status in {"optimal", "feasible"} else "failed"
        )
        if status == "completed":
            message = "Schedule generated successfully"
        else:
            message = (
                f"Could not assign workers to all required shifts "
                f"({unassigned_count} of {total_slot_count} slots unassigned, "
                f"{len(parsed_workers)} worker draft(s))"
            )

        return GenerateScheduleResponse(
            job_id=str(uuid4()),
            status=status,
            message=message,
            draft_count=len(parsed_workers),
            holiday_count=len(payload.holidays),
            worker_count=len(parsed_workers),
            assignment_count=len(assignments),
            total_slot_count=total_slot_count,
            workers=worker_table,
            assignments=[assignment.to_json() for assignment in assignments],
            preview=preview.to_json(),
            solver_status=solver_result.status,
            unassigned_slot_ids=solver_result.unassigned_slot_ids,
        )

    def _workers_for_preview(
        self,
        payload: GenerateScheduleRequest,
        parsed_workers: list[ParsedWorkerDraft],
    ) -> list[ParsedWorkerDraft]:
        parsed_by_id = {worker.worker_id: worker for worker in parsed_workers}
        preview_workers: list[ParsedWorkerDraft] = []

        for worker in payload.workers:
            if worker.deleted:
                continue

            existing = parsed_by_id.get(worker.id)
            if existing is not None:
                preview_workers.append(existing)
                continue

            preview_workers.append(
                ParsedWorkerDraft(
                    worker_id=worker.id,
                    draft_id="",
                    file_name="",
                    first_name=worker.first_name,
                    last_name=worker.last_name,
                    role=worker.role,
                    year=payload.year,
                    month=payload.month,
                    available_as_worker=worker.available_as_worker,
                    days=[],
                )
            )

        return preview_workers

    def _build_mock_worker_drafts(
        self,
        payload: GenerateScheduleRequest,
    ) -> list[ParsedWorkerDraft]:
        workers = [
            build_mock_parsed_worker(worker, year=payload.year, month=payload.month)
            for worker in payload.workers
            if not worker.deleted
        ]
        workers.sort(key=lambda item: (item.last_name.casefold(), item.first_name.casefold()))
        return workers

    def _parse_worker_drafts(
        self,
        payload: GenerateScheduleRequest,
        worker_roles: dict[str, Literal["worker", "boss"]],
    ) -> list[ParsedWorkerDraft]:
        workers_by_id = {worker.id: worker for worker in payload.workers}
        parsed: list[ParsedWorkerDraft] = []
        for draft in payload.worker_drafts:
            worker_meta = workers_by_id.get(draft.worker_id)
            role = worker_roles.get(draft.worker_id, "worker")
            available_as_worker = (
                worker_meta.available_as_worker if worker_meta is not None else True
            )
            worker = parse_worker_draft(
                worker_id=draft.worker_id,
                draft_id=draft.draft_id,
                file_name=draft.file_name,
                content_base64=draft.content_base64,
                role=role,
                year=payload.year,
                month=payload.month,
            )
            worker.available_as_worker = available_as_worker
            parsed.append(worker)
        return parsed

    def _build_shift_slots(self, payload: GenerateScheduleRequest) -> list[ShiftSlot]:
        templates_by_id = {template.id: template for template in payload.shift_templates}
        slots: list[ShiftSlot] = []

        for day_assignment in payload.day_assignments:
            template = templates_by_id.get(day_assignment.shift_template_id)
            if template is None:
                continue

            weekday_name = WEEKDAY_NAMES[date.fromisoformat(day_assignment.date).weekday()]
            for shift_index, shift in enumerate(template.shifts):
                if weekday_name not in shift.weekdays:
                    continue

                for position in range(shift.required_workers):
                    slots.append(
                        ShiftSlot(
                            slot_id=(
                                f"{day_assignment.date}__{template.id}__{shift_index}__{position}"
                            ),
                            date=day_assignment.date,
                            shift_template_id=template.id,
                            shift_index=shift_index,
                            role=shift.role,
                            start=shift.start,
                            end=shift.end,
                        )
                    )

        return slots
