"""Orchestrates podkład parsing and OR-Tools schedule generation."""

from __future__ import annotations

from datetime import date
from typing import Literal
from uuid import uuid4

from scheduler_engine.schemas.schedule_generate import GenerateScheduleRequest, GenerateScheduleResponse
from scheduler_engine.services.podklad_parser import ParsedWorkerDraft, parse_worker_draft
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
        parsed_workers = self._parse_worker_drafts(payload, worker_roles)
        worker_table = [worker.to_json() for worker in parsed_workers]
        slots = self._build_shift_slots(payload)
        solver_result = solve_schedule(parsed_workers, slots)

        status: Literal["completed", "failed"] = (
            "completed" if solver_result.status in {"optimal", "feasible"} else "failed"
        )
        message = (
            "Schedule generated successfully"
            if status == "completed"
            else "Could not assign workers to all required shifts"
        )

        return GenerateScheduleResponse(
            job_id=str(uuid4()),
            status=status,
            message=message,
            draft_count=len(payload.worker_drafts),
            holiday_count=len(payload.holidays),
            worker_count=len(parsed_workers),
            assignment_count=len(solver_result.assignments),
            workers=worker_table,
            assignments=[assignment.to_json() for assignment in solver_result.assignments],
            solver_status=solver_result.status,
            unassigned_slot_ids=solver_result.unassigned_slot_ids,
        )

    def _parse_worker_drafts(
        self,
        payload: GenerateScheduleRequest,
        worker_roles: dict[str, Literal["worker", "boss"]],
    ) -> list[ParsedWorkerDraft]:
        parsed: list[ParsedWorkerDraft] = []
        for draft in payload.worker_drafts:
            role = worker_roles.get(draft.worker_id, "worker")
            parsed.append(
                parse_worker_draft(
                    worker_id=draft.worker_id,
                    draft_id=draft.draft_id,
                    file_name=draft.file_name,
                    content_base64=draft.content_base64,
                    role=role,
                    year=payload.year,
                    month=payload.month,
                )
            )
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
