from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ScheduleDayAssignment(BaseModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    shift_template_id: str = Field(alias="shiftTemplateId")

    model_config = {"populate_by_name": True}


class ShiftDefinition(BaseModel):
    role: Literal["worker", "boss"]
    required_workers: int = Field(alias="requiredWorkers", ge=1)
    start: str
    end: str
    weekdays: list[str]

    model_config = {"populate_by_name": True}


class ShiftTemplate(BaseModel):
    id: str
    name: str
    shifts: list[ShiftDefinition]
    created_at: str = Field(alias="createdAt")

    model_config = {"populate_by_name": True}


class Holiday(BaseModel):
    id: str
    created_at: str = Field(alias="createdAt")
    name: str | None
    date: str
    start: int | None
    end: int | None

    model_config = {"populate_by_name": True}


class WorkerPayload(BaseModel):
    id: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    role: Literal["worker", "boss"]
    priority: int = Field(ge=1, le=10)
    checker: bool
    deleted: bool

    model_config = {"populate_by_name": True}


class WorkerDraftPayload(BaseModel):
    draft_id: str = Field(alias="draftId")
    worker_id: str = Field(alias="workerId")
    file_name: str = Field(alias="fileName")
    content_base64: str = Field(alias="contentBase64")

    model_config = {"populate_by_name": True}


class GenerateScheduleRequest(BaseModel):
    year: int = Field(ge=2000, le=2100)
    month: int = Field(ge=1, le=12)
    day_assignments: list[ScheduleDayAssignment] = Field(alias="dayAssignments", min_length=1)
    holidays: list[Holiday]
    shift_templates: list[ShiftTemplate] = Field(alias="shiftTemplates")
    worker_drafts: list[WorkerDraftPayload] = Field(alias="workerDrafts")
    workers: list[WorkerPayload]

    model_config = {"populate_by_name": True}


class GenerateScheduleResponse(BaseModel):
    job_id: str = Field(alias="jobId")
    status: Literal["completed", "failed"]
    message: str
    draft_count: int = Field(alias="draftCount")
    holiday_count: int = Field(alias="holidayCount")
    worker_count: int = Field(alias="workerCount")
    assignment_count: int = Field(alias="assignmentCount")
    workers: list[dict[str, Any]]
    assignments: list[dict[str, Any]]
    solver_status: Literal["optimal", "feasible", "infeasible"] = Field(alias="solverStatus")
    unassigned_slot_ids: list[str] = Field(alias="unassignedSlotIds")

    model_config = {"populate_by_name": True, "by_alias": True}
